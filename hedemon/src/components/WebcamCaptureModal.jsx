// components/WebcamCaptureModal.js
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

export default function WebcamCaptureModal({ onClose }) {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [webcamLoaded, setWebcamLoaded] = useState(false);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  return (
    <div className="modal modal-open">
      <div className="modal-box relative">
        <button onClick={onClose} className="btn btn-sm btn-circle absolute right-2 top-2">
          ✕
        </button>
        <h3 className="text-lg font-bold mb-4">Scan New Card</h3>
        <div className="relative">
          <Webcam
            className="rounded-lg shadow-md"
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: 'environment',
            }}
            onUserMedia={() => setWebcamLoaded(true)}
          />
          {/* Render the overlay only when the webcam is loaded */}
          {webcamLoaded && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-dashed border-accent w-56 h-80"></div>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <button className="btn btn-primary mr-2" onClick={capture}>
            Capture
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        {capturedImage && (
          <div className="mt-4">
            <h4 className="font-semibold">Captured Image:</h4>
            <img
              src={capturedImage}
              alt="Captured card"
              className="mt-2 rounded-md border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
