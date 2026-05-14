import { useState, useRef, useEffect } from "react";
import styled from "styled-components";

const WebcamContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  margin: 0 auto;
`;

const WebcamVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  background-color: #000;
  transform: scale(1); /* Flip the video for a more natural selfie view */
`;

const PreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
  transform: scaleX(1);
`;

const WebcamCanvas = styled.canvas`
  display: none;
`;

interface WebcamCaptureProps {
  captureRequested: boolean;
  resetRequested?: boolean;
  onCaptureComplete?: () => void;
  onResetComplete?: () => void;
  onCameraStateChange?: (isRunning: boolean) => void;
}

const WebcamCapture = ({
  captureRequested,
  resetRequested,
  onCaptureComplete,
  onResetComplete,
  onCameraStateChange,
}: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // We use stream state to track if the camera is actually active
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startWebcam = async () => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      setStream(newStream);
      setCapturedImage(null);
      onCameraStateChange?.(true);

      // Manually attach the stream to the video ref
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
    } catch (error) {
      console.error("Error accessing webcam", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      onCameraStateChange?.(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Ensure video has metadata before drawing
      if (context && video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);
        stopWebcam();
        onCaptureComplete?.();
      }
    }
  };

  useEffect(() => {
    onCameraStateChange?.(!!stream);
  }, [stream, onCameraStateChange]);

  useEffect(() => {
    if (resetRequested) {
      setCapturedImage(null);
      startWebcam();
      onResetComplete?.();
    }
  }, [resetRequested, onResetComplete]);

  useEffect(() => {
    if (captureRequested && stream) {
      captureImage();
    }
  }, [captureRequested, stream]);

  useEffect(() => {
    startWebcam();

    return () => {
      stopWebcam();
    };
  }, []);

  // CLEANUP: Stop the camera if the user leaves the page
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <WebcamContainer>
      {capturedImage ? (
        <PreviewImg src={capturedImage} alt="Captured" />
      ) : (
        <>
          {/* playsInline is required for mobile browsers */}
          <WebcamVideo ref={videoRef} autoPlay muted playsInline />
          <WebcamCanvas ref={canvasRef} />
          {!stream && (
            <p
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                margin: 0,
                padding: "8px 14px",
                backgroundColor: "rgba(255,255,255,0.9)",
                borderRadius: "16px",
                color: "#333",
                fontWeight: "bold",
                zIndex: 10,
              }}
            >
              Waiting for camera...
            </p>
          )}
        </>
      )}
    </WebcamContainer>
  );
};

export default WebcamCapture;