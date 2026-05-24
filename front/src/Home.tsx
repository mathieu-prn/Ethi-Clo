import { useState, useEffect } from "react"
import questionIcon from "./assets/question-icon.png"
import settingsIcon from "./assets/settings-icon.png"
import vekoImg from "./assets/veko.png"
import { useNavigate } from "react-router-dom"
import dykData from "./didYouKnow.json"
import "./styles/Home.css"

interface DykFact {
  fact: string
  highlight: string
  tags: string[]
}

function highlightFact(fact: DykFact) {
  if (!fact.highlight) return <>{fact.fact}</>
  const parts = fact.fact.split(fact.highlight)
  return (
    <>
      {parts[0]}
      <span className="dyk-highlight">{fact.highlight}</span>
      {parts[1]}
    </>
  )
}

const teamMembers = [
  { name: "Paola GUILLERMAIN", description: "Blbl." },
  { name: "Valentin CABANNES", description: "UI/UX designer focused on creating intuitive and accessible interfaces." },
  { name: "Mathieu PRINCE", description: "Data scientist specialized in ethical AI and environmental impact scoring." },
  { name: "Florian RIBRIOUX", description: "Backend engineer with expertise in API design and cloud infrastructure." },
  { name: "Ethan SAUVANET", description: "Product manager bridging the gap between users and technical teams." },
  { name: "Stéphanie TANG", description: "DevOps engineer ensuring smooth deployments and system reliability." },
]

function Home() {
    const navigate = useNavigate();
    const [dykOpen, setDykOpen] = useState(false)
    const [fact, setFact] = useState<DykFact | null>(null)
    useEffect(() => {
      const random = dykData[Math.floor(Math.random() * dykData.length)] as DykFact
      setFact(random)
    }, [])

  return (
    <>
      <header>
        <div className="top-buttons">
          <button id="help" onClick={() => navigate("/help")}>
            <img src={questionIcon} className="question-icon" alt="help" />
          </button>
          <button id="settings" onClick={() => navigate("/settings")}>
            <img src={settingsIcon} className="settings-icon" alt="settings" />
          </button>
        </div>

        <section className="banner">
          <div className="title-line">
            <h1 id="banner-title">Ethi'Cl</h1>
            <div className="smiley">
              <svg viewBox="0 0 100 100" className="smiley-svg">
                  <circle cx="50" cy="50" r="45" className="face" />
                  <circle cx="22" cy="40" r="6" className="eye" />
                  <circle cx="78" cy="40" r="6" className="eye" />
                  <path d="M30 50 Q50 60 70 50" className="mouth" />
              </svg>
            </div>
          </div>
          <h2 id="banner-subtitle">Better choices start with you</h2>
        </section>
      </header>

      <div className="home-body">
        <div className="scan-container">
          <button className="scan-button" onClick={() => navigate("/scan")}>Scan</button>
        </div>

        {/* DID YOU KNOW */}
        <div className="dyk-accordion">
          <button
            className="dyk-header"
            onClick={() => setDykOpen(!dykOpen)}
            aria-expanded={dykOpen}
          >
            <div className="dyk-header-left">
              <span className="dyk-icon">💡</span>
              <span>Did you know?</span>
            </div>
            <span className={`dyk-chevron ${dykOpen ? "open" : ""}`}>▾</span>
          </button>
          <div className={`dyk-body ${dykOpen ? "open" : ""}`}>
            {fact && (
              <>
                <p className="dyk-fact">{highlightFact(fact)}</p>
                <div className="dyk-tags">
                  {fact.tags.map((tag) => (
                    <span key={tag} className="dyk-tag">{tag}</span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ABOUT US */}
        <div className="about-us">
          <h2>─────── About Us ───────</h2>
        </div>

        <div className="carousel-wrapper">
          <div className={`carousel-wrapper ${dykOpen ? "carousel--shrunk" : ""}`}>
            <div className="carousel-track">
              {teamMembers.map((member, i) => (
                <div key={i} className="carousel-slide">
                  <span className="member-name">{member.name}</span>
                  <p className="member-description">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
          <img src={vekoImg} alt="veko" className="veko-image" />
        </div>
      </div>
    </>
  )
}

export default Home