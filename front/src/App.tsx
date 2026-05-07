import { useState } from 'react'
import './App.css'
import { Routes, Route } from "react-router-dom";
import Home from './Home.tsx'
import Scan from './Scan.tsx'
import Settings from "./Settings"

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Scan" element={<Scan />} />
        <Route path="/settings" element={<Settings />} />
    </Routes>
    </>
  )
}

export default App
