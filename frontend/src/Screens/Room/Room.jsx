import React from "react";
import { useEffect, useState, useRef } from "react";
import { useSocket } from "../../contexts/SocketContext";
import Peer from "peerjs"
import Sidebar from "./Sidebar";
import { Mic, MicOff, Camera, CameraOff, PhoneOff, Captions, CaptionsOff } from "lucide-react";
import "./Room.css"
// import useSpeechRecognition from "../../hooks/useSpeechRecognition";

function Room() {
    const [mystream, setMystream] = useState(null);
    const [remoteStream, setremoteStream] = useState(null);
    const [remotePeerId, setremotePeerId] = useState(null);
    const [remoteUser, setremoteUser] = useState(false);
    const [micOn, setMicOn] = useState(true);
    const [videoOn, setVideoOn] = useState(true);
    const [user, setUser] = useState(null);
    const userRef = useRef(null);
    const [isJoined, setIsJoined] = useState(false);
    const isCalling = useRef(false);

    const [socketId, setSocketId] = useState("");
    const MediaRecorderRef = useRef(null);


    const peerInstance = useRef(null);
    const { socket } = useSocket();

    const [remoteTranscription, setRemoteTranscription] = useState("");

    const [captions, setCaptions] = useState(false);
    // to clear previous timer ref otherwise with every word spoken 
    const captionTimeoutRef = useRef(null);

    const myVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (myVideoRef.current && mystream) {
            myVideoRef.current.srcObject = mystream;
            myVideoRef.current.onloadedmetadata = () => {
                myVideoRef.current.play().catch(e => console.log("Force play error:", e));
            };
        }
    }, [mystream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.onloadedmetadata = () => {
                remoteVideoRef.current.play().catch(e => console.log("Remote Play Error:", e));
            };
        }
    }, [remoteStream])

    // Loads the user data from local storage
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
            setUser(storedUser);
            userRef.current = storedUser;
        }

    }, []);

    // gets the stream, sets it to mystream 
    useEffect(() => {
        let peer = null;
        let localStream = null;
        const getStream = async () => {
            try {

                console.log("getStream called");
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: {
                        facingMode: "user"      // Explicitly ask for selfie camera
                    }
                })
                localStream = stream
                setMystream(stream);

                startRecording(stream);

                peer = new Peer(undefined, {
                    config: {
                        'iceServers': [
                            { url: 'stun:stun1.l.google.com:19302' },
                            { url: 'stun:stun2.l.google.com:19302' }
                        ]
                    }
                });
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

            }
            catch (err) {
                alert("Camera Error" + err)
            }
        }
        getStream();
        return () => {
            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }

            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        }
    }, [])

    // MIC
    const toggleMic = () => {
        const audioTrack = mystream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            setMicOn(!micOn);
            console.log("Mic :" + micOn);
        }
    };

    // VIDEO
    const toggleVideo = () => {
        const videoTrack = mystream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            setVideoOn(!videoOn);
            console.log("Video :" + videoOn);
        }
    };

    // CAPTIONS
    const toggleCaptions = () => {
        if (captions) {
            console.log("Captions false")
            setCaptions(false);
            socket.emit('send captions', { roomCode: user.roomCode, text: "" })
        }
        else {
            console.log("Captions true");
            setCaptions(true);
        }
    };

    const handleRoomJoin = () => {

        const sendJoinData = () => {
            const myPeerId = peerInstance.current.id
            socket.emit("join-room", {
                name: user.name,
                email: user.email,
                roomCode: user.roomCode,
                peerId: myPeerId
            });
            console.log("Clicked Join room");
        }

        if (!peerInstance.current) return;

        if (peerInstance.current.open) {
            sendJoinData();
        }
        else {
            peerInstance.current.on("open", () => {
                sendJoinData();
            })
        }
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
        window.location.href = "/"
    }

    useEffect(() => {

        const handleUserConnected = (data) => {
            const { email, name, id, socket_id } = data;
            setremotePeerId(id);
            setSocketId(socket_id);
            console.log(`Email: ${email}, Name: ${name} has connected, SocketId - ${socket_id}`);

            // calls the helper function 
            // if (!isCalling.current) {
            console.log(`Timeout finished. Calling ${name}...`);
            callUser(id, name);
            // }
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

                // DEBUG
                console.log("Remote Stream" + remoteStream.getTracks());
                remoteStream.getTracks().forEach(track => {
                    console.log(`Track Type: ${track.kind}`);
                    console.log(`Track State: ${track.readyState}`); // Should be "live"
                    console.log(`Track Enabled: ${track.enabled}`);

                    // Listen for the track being muted by the browser
                    track.onmute = () => console.log(`${track.kind} track was MUTED by the system`);
                    track.onunmute = () => console.log(`${track.kind} track was UNMUTED`);
                });
            });
        }

        socket.on("user-connected", handleUserConnected);

        return () => {
            socket.off("user-connected", handleUserConnected);
        };
    }, [socket, mystream]);

    // useEffect(() => {

    //     if (isListening && transcript && user?.roomCode) {
    //         console.log("DEBUG: Transcript:", transcript, "RoomCode:", user?.roomCode);
    //         console.log("Sending Captions");
    //         socket.emit('send captions', {
    //             roomCode: user.roomCode,
    //             text: transcript
    //         })
    //     };
    // }, [isListening, transcript, user, socket]);

    const startRecording = (activeStream) => {
        if (!activeStream || activeStream.getAudioTracks().length === 0) {
            console.error("Stream Not Recieving");
            return;
        }

        console.log("Stream recieved by the functions");
        // gets the mediaRecorder initiated
        const audioStream = new MediaStream([activeStream.getAudioTracks()[0]]);

        if (audioStream) { // remove
            const types = ["audio/webm", "audio/mp4", "audio/ogg", "audio/wav"];
            const supportedType = types.find(type => MediaRecorder.isTypeSupported(type));

            const extension = supportedType.includes("mp4") ? "mp4" : "webm";
            const filename = `audio.${extension}`

            const mediaRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm;codecs=opus" });
            MediaRecorderRef.current = mediaRecorder;

            if (!supportedType) {
                console.error("No supported audio MIME types found in this browser.");
                return;
            }

            // This fires an event every a time a chunk is ready 
            mediaRecorder.ondataavailable = async (event) => {

                const isMicEnabled = activeStream.getAudioTracks()[0]?.enabled;

                if (event.data && event.data.size > 500 && isMicEnabled && userRef.current?.roomCode) {
                    console.log("Sending the chunk to server");

                    const formData = new FormData();
                    formData.append("audio", event.data, "speech.webm");
                    formData.append("roomCode", userRef.current.roomCode);
                    formData.append("socket_id", socket.id);

                    try {
                        await fetch("http://localhost:8000/api/transcribe", {
                            method: "POST",
                            body: formData
                        })
                    }
                    catch (error) {
                        console.error("FAILED REQUEST: not sent to server");
                    }
                    // Start recording and produce a chunk every 3000ms (3 seconds)
                }
                else {
                    console.log("Clone Stream null");
                }
            }
            mediaRecorder.start();
            setInterval(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                    mediaRecorder.start();
                }
            }, 3000);
        }
    }

    useEffect(() => {

        const handleRecieveCaption = ({ text }) => {
            setRemoteTranscription(text);
            // console.log("Recieving Captions");

            if (captionTimeoutRef.current) {
                clearTimeout(captionTimeoutRef.current)
            }

            captionTimeoutRef.current = setTimeout(() => (setRemoteTranscription("")), 3000);
            return () => clearTimeout(captionTimeoutRef.current);
        }

        socket.on('Recieve-Captions', handleRecieveCaption);
        return () => {
            socket.off('Recieve-Captions', handleRecieveCaption);

            if (captionTimeoutRef.current) clearTimeout(captionTimeoutRef.current)
        }
    }, [socket])

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
                                muted={true}
                                playsInline
                                ref={myVideoRef}
                            />
                            <div className="username">{user.name}</div>
                        </div>
                    )}
                    {remoteStream && (
                        <div className="remote-stream">
                            <video
                                autoPlay
                                // muted
                                playsInline
                                ref={remoteVideoRef}
                                onPlaying={() => console.log("Remote video is officially playing!")}
                                style={{ backgroundColor: 'gray' }}
                            />
                            <div className="username">{(remoteUser) ? remoteUser : "Username"}</div>
                        </div>
                    )}
                </div>

                {(captions && remoteTranscription) ? <div className="!mt-130 !ml-10 h-12 w-[20rem] overflow-hidden md:!mt-0 !ml-100 w-[30rem]">{remoteTranscription}</div> : <div></div>}
                {/* {<div className="!mt-130 !ml-10 h-12 w-[20rem] overflow-hidden md:!mt-0 !ml-100 w-[30rem]">Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil consequatur harum culpa quia exercitationem sapiente accusantium facere obcaecati deleniti? Quae, delectus ad eius obcaecati velit dolorum suscipit! Sed, impedit ullam.</div>} */}

                <div className="call-nav">
                    {remoteStream && (<button style={{ backgroundColor: "red" }} onClick={disconnect}><PhoneOff /></button>)}
                    <button className='!bg-zinc-900' onClick={toggleMic}>
                        {micOn ? (<Mic />) : (<MicOff />)}
                    </button>
                    <button className='!bg-zinc-900' onClick={toggleVideo}>
                        {videoOn ? (<Camera />) : (<CameraOff />)}
                    </button>
                    <button className='!bg-zinc-900' onClick={toggleCaptions}>
                        {captions ? (<Captions />) : (<CaptionsOff />)}
                    </button>
                </div>
            </div>
        </>
    )
}
export default Room