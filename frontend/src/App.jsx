import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Lobby from './Screens/Lobby/Lobby.jsx'
import Room from './Screens/Room/Room.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Lobby />} />
      <Route path="/room/:roomCode" element={<Room />} />
    </Routes>
  )
}

export default App