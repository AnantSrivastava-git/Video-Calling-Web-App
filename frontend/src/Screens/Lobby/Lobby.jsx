// Lobby is a screen where the user will enter the room code to join a call, along with their name and email.

import react, { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext.jsx';
import HeroVideo from '../../pictures/silk.webm'
import { ClosedCaption, NotebookPen } from 'lucide-react';
import "./Lobby.css"

export default function Lobby() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [time, setTime] = useState("")

    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000)

        return () => clearInterval(interval);
    }, [])

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
            roomCode: roomCode,
        }))
        return
    }

    return (
        <>
            <div className='relative w-screen h-screen overflow-hidden'>
                <video src={HeroVideo} autoPlay muted loop className="inset-0 w-full h-full object-cover -z-10"></video>
                <div className="absolute w-full h-full top-0 flex flex-col md:flex-row gap-[3rem] overflow-y-auto md:overflow-hidden ">
                    <section className=" w-full md:w-[60vw] ">
                        <div className='text-5xl md:text-8xl w-fit relative top-[25rem] left-4 md:left-12'>{time}</div>
                        <div className='relative top-[25rem] left-4 md:left-12'>
                            <h1 className='text-[2rem] md:text-[3.2rem]'>P2P Video Calls. No Limits. No lag.</h1>
                            <h3>Crystal clear video calls enhanced with real-time AI captions. Connect seamlessly across devices and overcome language barriers instantly.</h3>
                        </div>
                        
                    </section>
                    <section className="relative top-[30rem] md:static w-full md:w-[36.5vw] h-[100vh] bg-[#0b0b0c] py-4">
                        <div className='text-[3rem] text-center'>Lobby</div>
                        <form onSubmit={handleSubmit} className="static flex flex-col gap-5 px-10 md:px-25 py-20">

                            <div className="flex flex-col gap-1">
                                <label htmlFor="name" className="w-fit px-5 py-1">Name to be displayed</label>
                                <input className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5" type="text" placeholder='John Doe' value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="name" className="w-fit px-5 py-1">Your email</label>
                                <input className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5" type="email" placeholder='johndoe@gmail.com' value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label htmlFor="name" className="w-fit px-5 py-1">Room you want to join</label>
                                <input className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5" type="text" placeholder='123-456-789' value={roomCode} onChange={(e) => setRoomCode(e.target.value)} />
                            </div>
                            <button className="" type='submit'>Join</button>
                        </form>
                        <div className='!ml-0 !mt-10 p-10 grid grid-cols-2 grid-rows-2 gap-2'>
                            <div className='col-span-1 text-[1rem] bg-zinc-900 border-gray-500 py-2 px-5 rounded-lg flex justify-between'><p>Live Captions</p><ClosedCaption/> </div>
                            <div className='row-span-2 col-span-1 text-[1rem] bg-zinc-900 border-gray-500 pt-5 px-2 rounded-lg'>Powered by WebRTC and PeerJS</div>
                            <div className='col-span-1 text-[1rem] bg-zinc-900 border-gray-500 py-2 px-[0.85rem] rounded-lg flex justify-between'><p>AI Summarizer</p> <NotebookPen/></div>
                        </div>
                    </section>
                </div>
            </div>
        </>
    )
};