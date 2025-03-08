'use client'
import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
  }, [webcamRef]);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl font-bold">Webcam Capture</h1>
          <Webcam
            className="rounded-lg shadow-md"
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: 'user',
            }}
          />
          <div className="card-actions mt-4">
            <button className="btn btn-primary" onClick={capture}>
              Capture Photo
            </button>
          </div>
          {capturedImage && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold">Captured Image:</h2>
              <img
                className="mt-2 rounded-md border border-base-300"
                src={capturedImage}
                alt="Captured from webcam"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebcamCapture;
