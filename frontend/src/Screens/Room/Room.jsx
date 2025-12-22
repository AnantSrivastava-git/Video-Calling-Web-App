// the key to video on off button would be negotiation functions... change them to manuak firing using buttons... this negotiation fires everytime whenever the contract changes ie. video activation, mic activation, network change from 4G to wifi

import React from "react";
import { useEffect, useState } from "react";
import { useSocket } from "../../contexts/SocketContext";
import Peer from "../../Service/Peer"
import Sidebar from "./Sidebar";
import "./Room.css"

function Room() {
    const [mystream, setMystream] = useState(null);
    const [remoteStream, setremoteStream] = useState(null);
    const [remoteSocketId, setremoteSocketId] = useState(null);
    const [incommingCall, setincommingCall] = useState(false);
    const [user, setUser] = useState({});
    const { socket } = useSocket();

    // useEffect(()=>{
    //     setUser(JSON.parse(localStorage.getItem("user")));
    // },[])


    const handleUserConnected = (data) => {
        const { email, name, id } = data;
        setremoteSocketId(id);
        console.log(`Email: ${email}, Name: ${name} has connected`);
    }

    const handleCall = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        // emiting or sending the offer to other user 
        const offer = await Peer.getOffer();
        socket.emit("user:call", { to: remoteSocketId, offer: offer });
        setMystream(stream);
    }

    const handleIncommingCall = async ({ from, offer }) => {
        setremoteSocketId(from);
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        })
        setMystream(stream);

        // BACKEND SE DUSRE USER KI CALL KI INFO AATI HAI LIKE HIS ID, AND OFFER CREATED BY HIM
        console.log("Incoming Call", from, offer);
        // the state used to create incomming call modal and assign answer button
        setincommingCall(true);
        // WE CREATE AN ANSWER WHICH IS TO BE SENT TO THE USER WHO CALLED
        const ans = await Peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, ans })
    }


    const sendstreams = () => {
        for (const track of mystream.getTracks()) {
            Peer.peer.addTrack(track, mystream);
        }
    }

    const handleCallAccepted = ({ from, ans }) => {
        // WE SET THE CALL TO LOCAL DESCRIPTION
        Peer.setLocalDescription(ans);
        console.log("Call Accepted");
        sendstreams()
    }

    const handleNegotitaion = async () => {
        const offer = await Peer.getOffer();
        socket.emit("peer:nego-needed", { to: remoteSocketId, offer: offer });
    }

    const handleNegoIncoming = async ({ from, offer }) => {
        const ans = await Peer.getAnswer(offer);
        socket.emit("peer:nego-done", { to: from, ans })
    }

    const handleNegoFinal = async ({ from, ans }) => {
        await Peer.setLocalDescription(ans);
    }

    const disconnect = (e)=>{
        e.preventDefault();
        // socket.off
        window.location.href = "http://localhost:5174"
    }


    useEffect(() => {
        Peer.peer.addEventListener("negotiationneeded", handleNegotitaion);
        return () => {
            Peer.peer.removeEventListener("negotiationneeded", handleNegotitaion)
        }
    }, [handleNegotitaion])

    useEffect(() => {
        Peer.peer.addEventListener("track", async ev => {
            const [remoteStream] = ev.streams;
            console.log("Got Tracks!");
            setremoteStream(remoteStream);
        })
    }, [])

    useEffect(() => {
        socket.on("user-connected", handleUserConnected);
        socket.on("incomming-call", handleIncommingCall);
        socket.on("call:accepted", handleCallAccepted);
        socket.on("peer:nego-needed", handleNegoIncoming);
        socket.on("peer:nego-final", handleNegoFinal);
        return () => {
            socket.off("user-connected", handleUserConnected);
            socket.off("incomming-call", handleIncommingCall);
            socket.off("call:accepted", handleCallAccepted);
            socket.off("peer:nego-needed", handleNegoIncoming);
            socket.off("peer:nego-final", handleNegoFinal);
        };
    }, [socket, handleUserConnected, handleIncommingCall, handleCallAccepted, handleNegoIncoming, handleNegoFinal]);



    return (
        <>

            <Sidebar />
            <div className="main">
                <h1>Room</h1>
                <h4>{remoteSocketId ? 'Connected' : 'No one in room'}</h4>
                {remoteSocketId && !incommingCall && <button className="call-btn" onClick={handleCall}>Call</button>}
                {mystream && incommingCall && <button onClick={sendstreams} className="accept-btn">Accept</button>}
                <div className="streams">
                {mystream && (
                    <div className="my-stream">
                        <video 
                            autoPlay
                            muted
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
                            muted
                            ref={(videoEl) => {
                                if (videoEl) videoEl.srcObject = remoteStream;
                            }}
                        />
                            <div className="username">Username</div>
                        </div>
                )}
                </div>
                {remoteStream &&(
                    <div className="call-nav">
                    <button style={{backgroundColor:"red"}} onClick={disconnect}>Hangup</button>
                    <button>Mic</button>
                    <button>Video</button>
                </div>
                )}
                

            </div>
        </>
    )
}

export default Room;