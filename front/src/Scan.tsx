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
  const [confirmed, setConfirmed] = useState(false);
  const [saveRequested, setSaveRequested] = useState(false);

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
    sendImageToBackend(imageData);
  };

  const onConfirm = () => {
    setConfirmed(true);
    setSaveRequested(true);
  };

  const onRetake = () => {
    setConfirmed(false);
    setSaveRequested(false);
    setResetRequested(true);
  };

  return (
    <div className="app">
      <div className="bg-circle-top"></div>
      <div className="bg-circle-bottom"></div>
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
          />
          {isLoading && (
            <div style={{
              textAlign: "center",
              marginTop: "16px",
              fontSize: "14px",
              color: "#666"
            }}>
              Processing image...
            </div>
          )}
        </div>
        {captured ? (
          <ConfirmButtons onConfirm={onConfirm} onRetake={onRetake} />
        ) : (
          <ScanButton
            onClick={onScanClick}
            disabled={!cameraRunning}
            label="SCAN"
          />
        )}
      </div>
    </div>
  );
}

type ScanButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
};

function ScanButton({ onClick, disabled, label = "SCAN" }: ScanButtonProps) {
  return (
    <button className="scan-btn" onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

type ConfirmButtonsProps = {
  onConfirm: () => void;
  onRetake: () => void;
};

function ConfirmButtons({ onConfirm, onRetake }: ConfirmButtonsProps) {
  return (
    <div className="confirm-buttons">
      <button className="scan-btn" onClick={onRetake}>RETAKE</button>
      <button className="scan-btn" onClick={onConfirm}>USE PHOTO</button>
    </div>
  );
}

export default Dashboard;