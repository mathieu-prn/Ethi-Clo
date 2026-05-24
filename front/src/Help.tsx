import { useNavigate } from "react-router-dom"
import { FaArrowLeft } from "react-icons/fa"
import "./styles/help.css"

function Help() {
    const navigate = useNavigate()
    return (
        <div className="help-page">
            <header className="help-header">
                <button id="back-button" onClick={() => navigate("/")}>
                    <FaArrowLeft />
                </button>
                <h1 className="help-title">Help</h1>
            </header>

            <div className="help-body">

                <section className="help-section">
                    <h2 className="help-section-title">🌿 What is Ethi'Clo?</h2>
                    <p className="help-section-text">
                        <strong>Ethi'Clo</strong> is an app that lets you scan the label of any clothing item
                        to instantly know its environmental and ethical impact.
                        Inspired by Yuka, our goal is to help you make better, more conscious fashion choices.
                    </p>
                </section>

                <div className="help-divider" />

                <section className="help-section">
                    <h2 className="help-section-title">📸 How to scan a label</h2>
                    <div className="help-steps">
                        <div className="help-step">
                            <span className="step-number">1</span>
                            <p>Press the <strong>Scan</strong> button on the home screen.</p>
                        </div>
                        <div className="help-step">
                            <span className="step-number">2</span>
                            <p>Point your camera at the clothing label and align it within the viewfinder.</p>
                        </div>
                        <div className="help-step">
                            <span className="step-number">3</span>
                            <p>Press the capture button, then confirm your photo with <strong>USE PHOTO</strong>.</p>
                        </div>
                        <div className="help-step">
                            <span className="step-number">4</span>
                            <p>Wait a few seconds while the label is analyzed.</p>
                        </div>
                        <div className="help-step">
                            <span className="step-number">5</span>
                            <p>View the results: brand, material, origin, care instructions, and impact scores.</p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    )
}

export default Help