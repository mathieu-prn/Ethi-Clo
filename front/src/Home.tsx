import ethiBanner from './assets/ethi-clo.png'
import settingsIcon from "./assets/settings-icon.png";
import { useNavigate } from "react-router-dom";
import "./Home.css"

function Home() {
    const navigate = useNavigate();
  return (
    <>
      <div className="hero-banner">
        <img src={ethiBanner} className="banner" alt="Ethi banner" />
      </div>

      <div className="top-buttons">
        <button id="settings" onClick={() => navigate("/settings")}>
          <img src={settingsIcon} className="settings-icon" alt="settings" />
        </button>
      </div> 

      <div className="scan-container">
        <button className="scan-button" onClick={() => navigate("/scan")}>Scan</button>
      </div>

      <div className="history">
        <h2>History -----------------------</h2>
      </div>
      
      <div className="scroll-block">

        <div className="item">
          <label>Clothes</label>
          <input type="text" />
        </div>

        <div className="item">
          <label>Clothes</label>
          <input type="text" />
        </div>

        <div className="item">
          <label>Clothes</label>
          <input type="text" />
        </div>

        <div className="item">
          <label>Clothes</label>
          <input type="text" />
        </div>

        <div className="item">
          <label>Clothes</label>
          <input type="text" />
        </div>
      </div>

      <footer>
        
      </footer>
    </>
  )
}

export default Home
