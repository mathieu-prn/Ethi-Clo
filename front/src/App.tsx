import './styles/App.css'
import { Routes, Route } from "react-router-dom";
import Home from './Home.tsx'
import Scan from './Scan.tsx'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Scan" element={<Scan />} />
    </Routes>
    </>
  )
}

export default App
