// Lobby is a screen where the user will enter the room code to join a call, along with their name and email.

import react, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';

export default function Lobby() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");

    const { socket } = useSocket();
    // Gets socket instance from the SocketContext
    // Used for real-time communication with the server

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        socket.emit("join-room", { name, email, roomCode });
        saveUser();
    }
    //Prevents default form submission
    // Emits "join-room" event with user details

    useEffect(() => {
        socket.on("join-room", (data) => {
            const {email, roomCode} =  data;
            console.log(`Email : ${email} has joined room: ${roomCode}. No of Participants: ${data.userCount}`);
            // trigger joining room and total count update
            navigate(`/room/${roomCode}`)
        })

        // clean up function
        return () => { socket.off("join-room") };
    }, [socket, navigate])
    // Listens for "join-room" response from server
    // Includes cleanup function to prevent memory leaks
    // Dependencies array ensures listener is only set up when socket changes



    // Flow of Operation
    // User enters their details in the form
    // On form submission, data is sent to server via socket
    // Server processes the join request
    // Component listens for server's response
    // Console logs the response data (for now)
    // This component serves as the entry point for users joining video calls, handling both the UI interaction and socket communication in a clean, organized manne


    const saveUser = ()=>{
        localStorage.setItem("user",JSON.stringify({
            email: email,
            name: name,
        }))
        return
    }

    return (
        <>
            <div>Lobby</div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder='Name' value={name} onChange={(e) => setName(e.target.value)} />
                <input type="email" placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="text" placeholder='Room Code' value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                <button type='submit'>Join</button>
            </form>
        </>
    )
};