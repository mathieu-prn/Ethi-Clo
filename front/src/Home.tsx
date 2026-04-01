import ethiBanner from './assets/ethi-clo.png'
import { useNavigate } from "react-router-dom";

function Home() {
    const navigate = useNavigate();
  return (
    <>
    <div className="top-buttons">
        <button onClick={() => navigate("/scan")}>Test 1</button>
        <button onClick={() => console.log("Test 2 clicked")}>Test 2</button>
        <button onClick={() => console.log("Test 3 clicked")}>Test 3</button>
    </div>

    <div className="hero-banner">
        <div className="banner-content">
          <img src={ethiBanner} className="banner" alt="Ethi banner" />
        </div>
    </div>   

    <div className="scan-container">
        <button className="scan-button">Scan</button>
    </div>

      {/*<div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>*/}
    </>
  )
} 

export default Home
