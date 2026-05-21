import { useState } from "react";
import WebcamCapture from "./WebcamCapture.tsx";
import "./styles/Scan.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface LabelInfo {
  brand?: string | null;
  size?: string | null;
  material?: string | null;
  care_instructions?: string | null;
  country_of_origin?: string | null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [captureRequested, setCaptureRequested] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saveRequested, setSaveRequested] = useState(false);

  const sendImageToBackend = async (imageData: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: imageData }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${text}`);
      }

      const data: LabelInfo = JSON.parse(text);
      navigate("/results", { state: { labelInfo: data } });
    } catch (error) {
      console.error("Error sending scan request:", error);
      alert("Failed to process image. Ensure the backend server is running and reachable.");
    } finally {
      setIsLoading(false);
    }
  };

  const onScanClick = () => {
    if (!cameraRunning) {
      alert("Please start the camera first");
      return;
    }
    setCaptureRequested(true);
  };

  const onCaptureComplete = () => {
    setCaptured(true);
    setCaptureRequested(false);
  };

  const onResetComplete = () => {
    setCaptured(false);
    setResetRequested(false);
  };

  const onImageCaptured = (imageData: string) => {
    setCapturedImageData(imageData);
  };

  const onConfirm = (imageData: string) => {
    setConfirmed(true);
    setSaveRequested(true);
    sendImageToBackend(imageData);
  };

  const onRetake = () => {
    setConfirmed(false);
    setSaveRequested(false);
    setResetRequested(true);
  };

  return (
    <div className="app">
      <header className="scan-header">
        <section className="banner">
          <h1 className="scan-title">Scan Label</h1>
        </section>
      </header>
      
        <div className="content">
          <button className="back-button" onClick={() => navigate("/")}>
            <FaArrowLeft />
          </button>

          <div className="card">
            <WebcamCapture
              captureRequested={captureRequested}
              resetRequested={resetRequested}
              saveRequested={saveRequested}
              onCaptureComplete={onCaptureComplete}
              onResetComplete={onResetComplete}
              onCameraStateChange={setCameraRunning}
              onImageCaptured={onImageCaptured}
              onConfirm={onConfirm}
            />
            {!captured && (
              <div className="viewfinder">
                <div className="viewfinder-inner"></div>
              </div>
            )}
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-spinner"></div>
                <p className="loading-text">Analyzing label...</p>
              </div>
            )}
          </div>

        {!captured && (
          <p className="scan-subtitle">
            Point your camera at the label and capture
          </p>
        )}

        {captured ? (
          <div className="confirm-buttons">
            <button className="scan-btn" onClick={onRetake}>RETAKE</button>
            <button className="scan-btn" onClick={() => onConfirm(capturedImageData || "")}>USE PHOTO</button>
          </div>
        ) : (
          <button
            className="scan-btn"
            onClick={onScanClick}
            disabled={!cameraRunning}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;