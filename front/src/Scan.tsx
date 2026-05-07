import { useState } from "react";
import WebcamCapture from "./WebcamCapture.tsx";
import "./styles/Scan.css";
import { FaArrowLeft } from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();
  const [captureRequested, setCaptureRequested] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
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
          />
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