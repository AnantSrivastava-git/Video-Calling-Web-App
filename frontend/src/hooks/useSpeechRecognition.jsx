// import React from "react";
// import { useState, useEffect, useRef } from 'react';

// const useSpeechRecognition = () => {

//     const [transcript, setTranscript] = useState("");
//     const [isListening, setIsListening] = useState(false);
//     const recognitionRef = useRef(null);
//     const isListeningRef = useRef(false);

//     useEffect(() => {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//         if (!SpeechRecognition) {
//             window.alert("Sorry Captions not supported by the browser");
//             return;
//         }

//         // api configuration
//         const recognition = new SpeechRecognition();
//         recognition.continuous = true;
//         recognition.interimResults = true;
//         recognition.lang = ['en-US', 'hi-IN'];

//         // handling results output
//         recognition.onresult = (event) => {
//             const current = event.resultIndex;
//             const text = event.results[current][0].transcript;

//             if (text.trim() !== ""){
//                 console.log(text);
//                 setTranscript(text);
//             }
//         }

//         // handle abrupt ending
//         recognition.onend = () => {
//             if (isListeningRef.current) {
//                 try {
//                     recognition.start();
//                     // console.log("Recognition Started");
//                 }
//                 catch (error) {
//                     console.log("Restart Error" + error);
//                 }
//             }
//         }

//         recognitionRef.current = recognition;

//         return () => { if (recognitionRef.current) recognitionRef.current.stop(); }
//     }, [])

//     const startListening = () => {
//         if (recognitionRef.current) {
//             try {
//                 console.log("Started listening");
//                 recognitionRef.current.start()
//                 setIsListening(true);
//                 isListeningRef.current = true;
//             }
//             catch (err) {
//                 console.log("Already started");
//             }
//         }
//     }

//     const stopListening = () => {
//         if (recognitionRef.current) {
//             try {
//                 console.log("Stopped Listening");
//                 recognitionRef.current.stop()
//                 setIsListening(false);
//                 isListeningRef.current = false;
//                 setTranscript("")
//             }
//             catch (err) {
//                 console.log("Already stopped");
//             }
//         }
//     }

//     return { transcript, isListening, startListening, stopListening };
// }

// export default useSpeechRecognition