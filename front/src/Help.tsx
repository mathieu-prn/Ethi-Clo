import { useNavigate } from "react-router-dom"
import { FaArrowLeft } from "react-icons/fa"
import "./styles/help.css"

function Help() {
    const navigate = useNavigate()
    return (
        <>
            <header>
                <div className="help-header">
                    <button id="back-button" onClick={() => navigate("/")}>
                        <FaArrowLeft />
                    </button>
                    <h1 id="help-title">Help</h1>
                </div>
            </header>
        </>
    )
}

export default Help