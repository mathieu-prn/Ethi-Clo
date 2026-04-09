import ethiBanner from './assets/ethi-clo.png'
import { useNavigate } from "react-router-dom";
import "./styles/Home.css"

function Home() {
    const navigate = useNavigate();
  return (
    <>
    <div className="top-buttons">
        <button onClick={() => console.log("Test 1 clicked")}>Test 1</button>
        <button onClick={() => console.log("Test 2 clicked")}>Test 2</button>
        <button onClick={() => console.log("Test 3 clicked")}>Test 3</button>
    </div>

    <div className="hero-banner">
          <img src={ethiBanner} className="banner" alt="Ethi banner" />
      </div>   

      <div className="scan-container">
        <button className="scan-button" onClick={() => navigate("/scan")}>Scan</button>
      </div>

      <div className="history">
        <h2>History</h2>
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

      <p className="read-the-docs">
        Ce site est en préparation avec 6 étudiants au bord du craquage mental. Merci de nous prendre en considération.
      </p>

      <footer>
        
      </footer>
    </>
  )
}

export default Home
