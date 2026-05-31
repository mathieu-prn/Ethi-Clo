import { useState, useEffect, useRef } from "react"
import questionIcon from "./assets/question-icon.png"
import settingsIcon from "./assets/settings-icon.png"
import vekoPaola from "./assets/veko-paola.png"
import vekoValentin from "./assets/veko-valentin.png"
import vekoMathieu from "./assets/veko-mathieu.png"
import vekoFlorian from "./assets/veko-flo.png"
import vekoEthan from "./assets/veko-ethan.png"
import vekoStephanie from "./assets/veko-steph.png"
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
  { name: "Paola GUILLERMAIN", description: "Back-End - OCR processing & score calculations.", img: vekoPaola },
  { name: "Valentin CABANNES", description: "Back-End - OCR processing & score calculations.", img: vekoValentin },
  { name: "Mathieu PRINCE", description: "Camera stream, Gemini API integration & Scan page core features.", img: vekoMathieu },
  { name: "Florian RIBRIOUX", description: "Camera access, scan capture & image processing.", img: vekoFlorian },
  { name: "Ethan SAUVANET", description: "Front-End - UX implementation & UI development.", img: vekoEthan },
  { name: "Stéphanie TANG", description: "Front-End - Design, UX and assets implementation & UI development.", img: vekoStephanie },
]

function Home() {
  const navigate = useNavigate()
  const [dykOpen, setDykOpen] = useState(false)
  const [fact, setFact] = useState<DykFact | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [displayedImg, setDisplayedImg] = useState<string>(teamMembers[0].img)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const random = dykData[Math.floor(Math.random() * dykData.length)] as DykFact
    setFact(random)
  }, [])

  useEffect(() => {
    setDisplayedImg(teamMembers[0].img)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const handleScroll = () => {
      const slides = track.querySelectorAll<HTMLElement>(".carousel-slide")
      if (!slides.length) return
      let closest = 0
      let minDiff = Infinity
      slides.forEach((slide, i) => {
        const diff = Math.abs(slide.offsetLeft - track.scrollLeft)
        if (diff < minDiff) {
          minDiff = diff
          closest = i
        }
      })
      setActiveIndex(closest)
    }

    track.addEventListener("scroll", handleScroll, { passive: true })
    return () => track.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    setFading(true)
    const timeout = setTimeout(() => {
      setDisplayedImg(teamMembers[activeIndex].img)
      setFading(false)
    }, 180)
    return () => clearTimeout(timeout)
  }, [activeIndex])

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

        <div className="about-us">
          <h2>─────── About Us ───────</h2>
        </div>

        <div className="carousel-wrapper">
          <div className={`carousel-inner ${dykOpen ? "carousel--shrunk" : ""}`}>
            <div className="carousel-track" ref={trackRef}>
              {teamMembers.map((member, i) => (
                <div key={i} className="carousel-slide">
                  <span className="member-name">{member.name}</span>
                  <hr></hr>
                  <p className="member-description">{member.description}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src={displayedImg}
            alt="veko"
            className={`veko-image${fading ? " veko-fade" : ""}`}
          />
        </div>
      </div>
    </>
  )
}

export default Home