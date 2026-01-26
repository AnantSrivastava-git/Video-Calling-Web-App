/*
  ===========================
  SocketContext Summary
  ===========================

  Why this context is created:
  - Contexts in React help avoid "props drilling" (passing data through many nested components).
  - SocketContext provides a single, shared socket connection to all components in the app.
  - This prevents creating multiple socket connections and makes it easy for any component to access socket functionality.

  How to use contexts for other cases:
  - Create a context using React's createContext for any shared state or functionality (e.g., user authentication, theme, language).
  - Wrap your main App (or relevant component tree) with the context provider.
  - Access the context in child components using useContext or Context.Consumer.

  Why SocketContext is wrapped around the app:
  - Wrapping the entire app ensures all components can access the same socket instance.
  - This is important for features like chat, calls, notifications, etc., that need real-time communication.

  How to wrap/import your context for use:
  - In your main entry file (e.g., App.js), wrap your app with the context provider:
      <SocketProvider>
        <App />
      </SocketProvider>
  - In any component, import the context and use useContext:
      import { SocketContext } from './contexts/SocketContext';
      const socket = useContext(SocketContext);

  For other contexts, follow the same pattern:
    1. Create context and provider.
    2. Wrap your app or relevant component tree.
    3. Import and use the context in child components.

  This approach keeps your code clean, avoids unnecessary re-renders, and makes shared state management easier.
*/

// Contexts are created to avoid props drilling basically koi component jisko kisi aur ka koi stateful variable chaiye toh use props me drill krke bhejne se better hai ki hum context ko use kre nhi toh for cases where we have mulitple nested parent child components vaha har child k thru props drill krne padte to avoid hum uska context bana dete hai and directly use import krlete hai EZ JOB

// FOR HERE WE CREATE A SOCKET CONTEXT AND WRAP IT AROUND THE APP SO THAT PURE APP K COMPONENTS EZLY SOCKET SE CONNECTED RAHE NHI TOH BAR BAR HAR PAGE PE NAYA CONNECTION BNANA PADEGA UNTILL US PAGEN PE HI CODE AUR SOCKET KI KOI FUNCTIONALITY LIKE CHAT YA CALL NA USE KRNA HO  

import React, { useContext } from "react";
import { createContext, useMemo } from "react";
import { io } from "socket.io-client"

export const SocketContext = createContext(null);

export const useSocket = () =>{
  const Socket = useContext(SocketContext);
  return Socket;
}

export const SocketProvider = ( props ) => {

  // useMemo makes sure baar baar connection na krna pade ek baar krke hi kaam ho jayga
  // localhost:8000
  const socket = useMemo(()=> io("localhost:8000", {
    transports: ["websocket"],
  }), [])

  // Socket connection logic here
  return (
    <SocketContext.Provider value={{ socket }}>
      {props.children}
    </SocketContext.Provider>
  );
};