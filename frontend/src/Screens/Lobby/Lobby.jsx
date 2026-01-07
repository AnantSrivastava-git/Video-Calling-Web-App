// Lobby is a screen where the user will enter the room code to join a call, along with their name and email.

import react, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';

export default function Lobby() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");

    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        saveUser();
        navigate(`/room/${roomCode}`)
    }

    // Flow of Operation
    // User enters their details in the form
    // On form submission, data is assigned in local storage


    const saveUser = () => {
        localStorage.setItem("user", JSON.stringify({
            email: email,
            name: name,
            room: roomCode,
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