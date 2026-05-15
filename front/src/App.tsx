import './styles/App.css'
import { Routes, Route } from "react-router-dom";
import Home from './Home.tsx'
import Scan from './Scan.tsx'
import LabelResultsPage from './LabelResultsPage.tsx'
import Settings from './settings.tsx';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/results" element={<LabelResultsPage />} />
          <Route path="/settings" element={<Settings />} />
    </Routes>
    </>
  )
}

export default App
