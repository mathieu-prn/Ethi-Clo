import './styles/App.css'
import { Routes, Route } from "react-router-dom";
import Home from './Home.tsx'
import Scan from './Scan.tsx'
import LabelResultsPage from './LabelResultsPage.tsx'
import Settings from './settings.tsx';
import Help from './Help.tsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/results" element={<LabelResultsPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/help" element={<Help />} />
    </Routes>
    </>
  )
}

export default App