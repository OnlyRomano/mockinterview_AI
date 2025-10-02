"use client";
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from 'face-api.js';
import PropTypes from 'prop-types';

const FaceDetection = ({ onFaceData, isActive = true, tuning = {} }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const awayCounterRef = useRef(0);
  const lookCounterRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faceData, setFaceData] = useState({
    isDetected: false,
    confidence: 0,
    expressions: {},
    landmarks: null,
    boundingBox: null,
    faceCount: 0,
    isLookingAway: false,
    isGazeAway: false,
    timestamp: Date.now()
  });

  // Load face-api models
  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load all required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ]);
      
      console.log('Face-api models loaded successfully');
    } catch (err) {
      console.error('Error loading face-api models:', err);
      setError('Failed to load face detection models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
        };
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Camera access denied or not available');
    }
  }, []);

  // Detect faces and expressions
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Detect faces with expressions and landmarks
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const faceCount = detections.length;
      if (faceCount > 0) {
        const detection = detections[0]; // primary face
        
        // Draw face detection box
        const { x, y, width, height } = detection.detection.box;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);

        // Draw landmarks
        if (detection.landmarks) {
          ctx.fillStyle = '#ff0000';
          detection.landmarks.positions.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        }

        // Heuristic for looking away using eye aspect and nose direction
        let isLookingAway = false;
        let isGazeAway = false;
        try {
          const nose = detection.landmarks.getNose();
          const leftEye = detection.landmarks.getLeftEye();
          const rightEye = detection.landmarks.getRightEye();
          if (nose && leftEye && rightEye) {
            const noseTip = nose[Math.floor(nose.length / 2)];
            const leftEyeCenter = leftEye.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}),{x:0,y:0});
            leftEyeCenter.x /= leftEye.length; leftEyeCenter.y /= leftEye.length;
            const rightEyeCenter = rightEye.reduce((a,b)=>({x:a.x+b.x,y:a.y+b.y}),{x:0,y:0});
            rightEyeCenter.x /= rightEye.length; rightEyeCenter.y /= rightEye.length;
            const eyeMid = { x: (leftEyeCenter.x + rightEyeCenter.x) / 2, y: (leftEyeCenter.y + rightEyeCenter.y) / 2 };
            const dx = noseTip.x - eyeMid.x;
            const dy = noseTip.y - eyeMid.y;
            const interOcular = Math.max(Math.abs(rightEyeCenter.x - leftEyeCenter.x), 1);
            // Absolute normalized deviation (no calibration)
            const lateralDev = Math.abs(dx) / interOcular;
            const verticalDev = Math.abs(dy) / interOcular;
            // Require confident detection
            const confident = (detection.detection.score || 0) > (tuning.minConfidence || 0.7);
            // Stricter thresholds to avoid FP; looking-away if consistent significant deviation
            const lateralThreshold = tuning.lateralThreshold ?? 0.35;
            const verticalThreshold = tuning.verticalThreshold ?? 0.8;
            const computedAway = confident && (lateralDev > lateralThreshold || verticalDev > verticalThreshold);
            // Eye-gaze proxy: if head largely straight (small lateral deviation) but vertical deviation significant, 
            // infer reading/downward gaze; also allow mild side gaze with very small head rotation
            if (confident) {
              const nearStraight = lateralDev < (tuning.gazeStraightLateral ?? 0.2);
              const downGaze = verticalDev > (tuning.gazeDownVertical ?? 0.55);
              const mildSide = lateralDev > (tuning.gazeSideMin ?? 0.25) && lateralDev < (tuning.gazeSideMax ?? 0.4);
              isGazeAway = (nearStraight && downGaze) || mildSide;
            }
            // Simple temporal smoothing: need 3 consecutive frames to flip state
            if (computedAway) {
              awayCounterRef.current += 1;
              lookCounterRef.current = 0;
            } else {
              lookCounterRef.current += 1;
              awayCounterRef.current = 0;
            }
            const flipFrames = tuning.flipFrames ?? 3;
            if (awayCounterRef.current >= flipFrames) {
              isLookingAway = true;
            } else if (lookCounterRef.current >= flipFrames) {
              isLookingAway = false;
            } else {
              isLookingAway = faceData.isLookingAway;
            }
          }
        } catch {}

        // Update face data
        const newFaceData = {
          isDetected: true,
          confidence: detection.detection.score,
          expressions: detection.expressions,
          landmarks: detection.landmarks,
          boundingBox: detection.detection.box,
          faceCount,
          isLookingAway,
          isGazeAway,
          timestamp: Date.now()
        };

        setFaceData(newFaceData);
        
        // Call callback with face data
        if (onFaceData) {
          onFaceData(newFaceData);
        }
      } else {
        // No face detected
        const newFaceData = {
          isDetected: false,
          confidence: 0,
          expressions: {},
          landmarks: null,
          boundingBox: null,
          faceCount: 0,
          isLookingAway: false,
          isGazeAway: false,
          timestamp: Date.now()
        };

        setFaceData(newFaceData);
        
        if (onFaceData) {
          onFaceData(newFaceData);
        }
      }
    } catch (err) {
      console.error('Error detecting faces:', err);
    }
  }, [isActive, onFaceData]);

  // Initialize models once, and camera only when active
  useEffect(() => {
    const initialize = async () => {
      await loadModels();
    };

    initialize();

    return () => {
      // Cleanup on unmount
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [loadModels]);

  // Start/stop camera based on isActive
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (isActive) {
        await initializeCamera();
        if (cancelled) {
          if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }
        }
      } else {
        if (videoRef.current?.srcObject) {
          const tracks = videoRef.current.srcObject.getTracks();
          tracks.forEach(track => track.stop());
          videoRef.current.srcObject = null;
        }
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    };
    start();
    return () => { cancelled = true; };
  }, [isActive, initializeCamera]);

  // no calibration reset needed

  // Start face detection loop
  useEffect(() => {
    if (!isLoading && isActive) {
      const interval = setInterval(detectFaces, 100); // Detect every 100ms
      return () => clearInterval(interval);
    }
  }, [isLoading, isActive, detectFaces]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-200 mx-auto mb-2"></div>
          <p>Loading face detection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="w-full h-auto rounded-lg"
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />
    </div>
  );
};

FaceDetection.propTypes = {
  onFaceData: PropTypes.func,
  isActive: PropTypes.bool
};

export default FaceDetection;
