import React from "react";
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import Peer from "peerjs"
import Sidebar from "./Sidebar";
import { Mic, MicOff, Camera, CameraOff, PhoneOff } from "lucide-react";
import "./Room.css"

function Room() {
    const [mystream, setMystream] = useState(null);
    const [remoteStream, setremoteStream] = useState(null);
    const [remotePeerId, setremotePeerId] = useState(null);
    const [remoteUser, setremoteUser] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [user, setUser] = useState(null);
    const [isJoined, setIsJoined] = useState(false);
    const isCalling = useRef(false);

    const peerInstance = useRef(null);
    const { socket } = useSocket();

    // Loads the user data from local storage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) setUser(storedUser);
    }, []);

    // gets the stream, sets it to mystream 
    useEffect(() => {
        const getStream = async () => {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })
            setMystream(stream);

            const peer = new Peer();
            peerInstance.current = peer;

            peer.on('call', (call) => {
                console.log("Incomming Call");

                call.answer(stream); // answering with stream

                // Recieving the caller stream
                call.on('stream', (userVideoStream) => {
                    console.log("Recieving the remote stream");
                    setremoteStream(userVideoStream);
                })
            })

            return () => {
                peer.destroy();
            }
        }
        getStream();
    }, [])


    const toggleMic = () => {
        const audioTrack = mystream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(!micOn);
            console.log("Mic :" + micOn);
        }
    };

    const toggleVideo = () => {
        const videoTrack = mystream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(!videoOn);
            console.log("Video :" + videoOn);
        }
    };

    const handleRoomJoin = () => {

        if (!peerInstance.current) return;

        const myPeerId = peerInstance.current.id

        socket.emit("join-room", {
            name: user.name,
            email: user.email,
            roomCode: user.roomCode,
            peerId: myPeerId
        });

    }

    useEffect(() => {
        socket.on("join-room", (data) => {
            const { email, roomCode } = data;
            console.log(`Email : ${email} has joined room: ${roomCode}. No of Participants: ${data.userCount}`);
            setIsJoined(true);
        })

        // clean up function
        return () => { socket.off("join-room") };
    }, [socket])

    const disconnect = (e) => {
        e.preventDefault();
        window.location.href = "http://localhost:5174"
    }

    useEffect(() => {

        const handleUserConnected = (data) => {
            const { email, name, id } = data;
            setremotePeerId(id);
            console.log(`Email: ${email}, Name: ${name} has connected`);

            // calls the helper function 
            callUser(id, name);

        }

        const callUser = async (remoteId, remoteName) => {

            if (!peerInstance.current || !mystream) return;

            // emiting or sending the offer to other user 
            console.log(`Calling ${remoteId}`);

            isCalling.current = true;
            const call = peerInstance.current.call(remoteId, mystream);

            call.on('stream', (remoteStream) => {
                console.log("Caller received the remote stream");
                setremoteUser(remoteName);
                setremoteStream(remoteStream);
            });
        }

        socket.on("user-connected", handleUserConnected);

        return () => {
            socket.off("user-connected", handleUserConnected);
        };
    }, [socket, mystream]);



    return (
        <>

            <Sidebar />
            <div className="main">
                <h1>Room</h1>
                <h4>{remotePeerId ? 'Connected' : 'No one in room'}</h4>
                {mystream && !isJoined && <button onClick={handleRoomJoin} className="accept-btn"
                    disabled={!mystream}
                    style={{ opacity: mystream ? 1 : 0.5 }}
                >{mystream ? "Join Meeting" : "Starting Camera..."}</button>}
                <div className="streams">
                    {mystream && (
                        <div className="my-stream">
                            <video
                                autoPlay
                                // muted
                                ref={(videoEl) => {
                                    if (videoEl) videoEl.srcObject = mystream;
                                }}
                            />
                            <div className="username">{user.name}</div>
                        </div>
                    )}
                    {remoteStream && (
                        <div className="remote-stream">
                            <video
                                autoPlay
                                // muted
                                ref={(videoEl) => {
                                    if (videoEl) videoEl.srcObject = remoteStream;
                                }}
                            />
                            <div className="username">{(remoteUser)? remoteUser : "Username"}</div>
                        </div>
                    )}
                </div>
                <div className="call-nav">
                    {remoteStream && (<button style={{ backgroundColor: "red" }} onClick={disconnect}><PhoneOff /></button>)}
                    <button onClick={toggleMic}>
                        {micOn ? (<Mic />) : (<MicOff />)}
                    </button>
                    <button onClick={toggleVideo}>
                        {videoOn ? (<Camera />) : (<CameraOff />)}
                    </button>
                </div>
            </div>
        </>
    )
}

export default Room;