import { useState } from "react";
import WebcamCapture from "./WebcamCapture.tsx";

function Dashboard() {
  const [captureRequested, setCaptureRequested] = useState(false);
  const [cameraRunning, setCameraRunning] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);

  const onScanClick = () => {
    if (captured) {
      setResetRequested(true);
      return;
    }
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

  return (
    <div className="app">
      {/* Background circles */}
      <div className="bg-circle-top"></div>
      <div className="bg-circle-bottom"></div>

      {/* Foreground UI */}
      <div className="content">
        <div className="card">
          <WebcamCapture
            captureRequested={captureRequested}
            resetRequested={resetRequested}
            onCaptureComplete={onCaptureComplete}
            onResetComplete={onResetComplete}
            onCameraStateChange={setCameraRunning}
          />
        </div>
        <ScanButton
          onClick={onScanClick}
          disabled={!cameraRunning && !captured}
          label={captured ? "RETAKE" : "SCAN"}
        />
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

export default Dashboard;
