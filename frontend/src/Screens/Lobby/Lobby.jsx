// Lobby is a screen where the user will enter the room code to join a call, along with their name and email.

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
import react, { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useSocket } from "../../contexts/SocketContext.jsx";
import HeroVideo from "../../pictures/silk.webm";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import {
  ClosedCaption,
  Copy,
  Cross,
  NotebookPen,
  PanelRightClose,
  ShieldClose,
  X,
} from "lucide-react";
import "./Lobby.css";

export default function Lobby() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [time, setTime] = useState("");

  const [dialog, setDialog] = useState(false);
  const [summaryDialog, setSummaryDialog] = useState(false);
  const [summaryRoomCode, setSummaryRoomCode] = useState("");
  const [summary, setSummary] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(
        new Date().toLocaleString([], { hour: "2-digit", minute: "2-digit" }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveUser();
    navigate(`/room/${roomCode}`);
  };

  const handleSummary = async () => {
    try {
      console.log("Sending the req\n");
      console.log(summaryRoomCode);
      const res = await axios.post(`${BACKEND_URL}/api/summarize`, {
        roomCode: summaryRoomCode,
      });
      if (res.status === 200) {
        setDialog(false);
        setSummaryDialog(true);
      }
      setSummary(res.data.summary);
    } catch (error) {
      console.error("ERROR : ", error);
    }
  };
  // Flow of Operation
  // User enters their details in the form
  // On form submission, data is assigned in local storage

  const saveUser = () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: email,
        name: name,
        roomCode: roomCode,
      }),
    );
    return;
  };

  return (
    <>
      <div
        className={`relative w-screen h-screen overflow-hidden bg-transparent`}
      >
        {(dialog || summaryDialog) && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-40"
            onClick={() => setDialog(false)}
          />
        )}
        <div className={`relative w-screen h-screen overflow-hidden`}>
          <video
            src={HeroVideo}
            autoPlay
            muted
            loop
            className="inset-0 w-full h-full object-cover -z-10"
          ></video>
          <div className="absolute w-full h-full top-0 flex flex-col md:flex-row gap-[3rem] overflow-y-auto md:overflow-hidden ">
            <section className=" w-full md:w-[60vw] ">
              <div className="text-5xl md:text-8xl w-fit relative top-[25rem] left-4 md:left-12">
                {time}
              </div>
              <div className="relative top-[25rem] left-4 md:left-12">
                <h1 className="text-[2rem] md:text-[3.2rem]">
                  P2P Video Calls. No Limits. No lag.
                </h1>
                <h3>
                  Crystal clear video calls enhanced with real-time AI captions.
                  Connect seamlessly across devices and overcome language
                  barriers instantly.
                </h3>
              </div>
            </section>
            <section className="relative top-[30rem] md:static w-full md:w-1/2 h-[100vh] bg-[#0b0b0c] py-4">
              <div className="text-[3rem] text-center">Lobby</div>
              <form
                onSubmit={handleSubmit}
                className="static flex flex-col gap-5 px-10 md:px-25 py-20"
              >
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="w-fit px-5 py-1">
                    Name to be displayed
                  </label>
                  <input
                    className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="w-fit px-5 py-1">
                    Your email
                  </label>
                  <input
                    className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5"
                    type="email"
                    placeholder="johndoe@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="w-fit px-5 py-1">
                    Room you want to join
                  </label>
                  <input
                    className="w-[20rem] rounded-[8px] bg-[#2d2d2d] px-2 py-0.5"
                    type="text"
                    placeholder="123-456-789"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value)}
                  />
                </div>
                <div className="flex flex-row gap-1 mt-5">
                  <button className="bg-[#39138d] border border-neutral-500" type="submit">
                    Join
                  </button>
                  <button
                  type="button"
                    className="bg-neutral-700 w-70 left-25 sm:bottom-75 sm:left-278 !ml-5 transition-all duration-300- hover:bg-neutral-800"
                    onClick={() => setDialog(true)}
                  >
                    View last meetings' summary
                  </button>
                </div>
              </form>

              <div className="!ml-0 !mt-10 p-10 grid grid-cols-2 grid-rows-2 gap-2">
                <div className="col-span-1 text-[1rem] bg-zinc-900 border-gray-500 py-2 px-5 rounded-lg flex justify-between">
                  <p>Live Captions</p>
                  <ClosedCaption />{" "}
                </div>
                <div className="row-span-2 col-span-1 text-[1rem] bg-zinc-900 border-gray-500 pt-5 px-2 rounded-lg">
                  Powered by WebRTC and PeerJS
                </div>
                <div className="col-span-1 text-[1rem] bg-zinc-900 border-gray-500 py-2 px-[0.85rem] rounded-lg flex justify-between">
                  <p>AI Summarizer</p> <NotebookPen />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      {dialog && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  rounded-lg pt-2 px-4 bg-neutral-800 h-42 w-100 z-50"
        >
          <div className="flex row justify-between">
            <h2 className="!pt-2.5">Enter the Room Code</h2>
            <button
              onClick={() => setDialog(false)}
              className="rounded-2xl !px-0"
            >
              <X className="!p-0" />
            </button>
          </div>
          <input
            type="text"
            className="border border-neutral-700 rounded-lg bg-neutral-900 p-1 px-5"
            onChange={(e) => setSummaryRoomCode(e.target.value)}
            placeholder="123-465-789"
          />
          <button
            className="text-xs bg-neutral-900 !p-1 !px-2 !ml-2"
            onClick={handleSummary}
          >
            Summarize
          </button>
          <p className="pt-3 text-xs">
            The summary generation may take long time to generate, please be
            patient.
          </p>
          <p className="pt-1 text-xs text-neutral-400">
            For Sample Summary please use the roomcode "000"
          </p>
        </div>
      )}
      {summaryDialog && (
        <div
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                  rounded-lg pt-2 px-4 bg-neutral-800 !pb-5 w-100 z-50"
        >
          <div className="flex row justify-between !mb-2">
            <h2 className="!pt-2.5">Summary</h2>
            <div className="flex flex-row gap-3">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    summary.replace(/\*\*(.*?)\*\*/g, "$1"),
                  )
                }
                className="rounded-2xl !px-0"
              >
                <Copy className="!p-0" />
              </button>
              <button
                onClick={() => setSummaryDialog(false)}
                className="rounded-2xl !px-0"
              >
                <X className="!p-0" />
              </button>
            </div>
          </div>

          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}
    </>
  );
}
