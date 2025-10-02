"use client";
import React, { useState } from 'react';
import FaceDetection from '@/components/FaceDetection';
import { useFaceDetection } from '@/hooks/useFaceDetection';

const FaceDetectionDemo = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [results, setResults] = useState(null);
  const { faceData, processFaceData, startTracking, stopTracking, getCurrentData } = useFaceDetection();

  const handleStartTracking = () => {
    startTracking();
    setIsTracking(true);
    setResults(null);
  };

  const handleStopTracking = () => {
    const data = stopTracking();
    setResults(data);
    setIsTracking(false);
  };

  const handleGetCurrentData = () => {
    const data = getCurrentData();
    setResults(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Face Detection Demo
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Face Detection Component */
          }
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Live Face Detection
            </h2>
            <FaceDetection 
              onFaceData={processFaceData}
              isActive={true}
            />

            {/* Live status */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Face Detected:</span>
                <span className={`ml-2 ${faceData.isDetected ? 'text-green-600' : 'text-red-600'}`}>
                  {faceData.isDetected ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Confidence:</span>
                <span className="ml-2">{(faceData.confidence * 100).toFixed(1)}%</span>
              </div>
              <div>
                <span className="font-medium">Faces In Frame:</span>
                <span className="ml-2">{faceData.faceCount || 0}</span>
              </div>
              <div>
                <span className="font-medium">Looking Away:</span>
                <span className={`ml-2 ${faceData.isLookingAway ? 'text-red-600' : 'text-green-600'}`}>
                  {faceData.isLookingAway ? 'Yes' : 'No'}
                </span>
              </div>
            </div>

            {/* Removed tuning sliders */}
          </div>

          {/* Controls and Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">
              Tracking Controls
            </h2>
            
            <div className="space-y-4 mb-6">
              <button
                onClick={handleStartTracking}
                disabled={isTracking}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isTracking 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isTracking ? 'Tracking...' : 'Start Tracking'}
              </button>

              <button
                onClick={handleStopTracking}
                disabled={!isTracking}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  !isTracking 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                Stop Tracking & Get Results
              </button>

              <button
                onClick={handleGetCurrentData}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors"
              >
                Get Current Data
              </button>
            </div>

            {/* Results Display */}
            {results && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                  Face Detection Results
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Face Detected:</span>
                    <span className={results.isDetected ? 'text-green-600' : 'text-red-600'}>
                      {results.isDetected ? 'Yes' : 'No'}
                    </span>
                  </div>
                  
                  {results.isDetected && (
                    <>
                      <div className="flex justify-between">
                        <span className="font-medium">Average Confidence:</span>
                        <span>{(results.averageConfidence * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Looking Away:</span>
                        <span>{((results.lookingAwayRatio || 0) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Multiple People Visible:</span>
                        <span>{((results.multiPersonRatio || 0) * 100).toFixed(1)}%</span>
                      </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Eyes Off-Screen/Reading:</span>
                      <span>{((results.gazeAwayRatio || 0) * 100).toFixed(1)}%</span>
                    </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Dominant Expression:</span>
                        <span className="capitalize">{results.dominantExpression}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Duration:</span>
                        <span>{(results.faceDetectionDuration / 1000).toFixed(1)}s</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="font-medium">Samples:</span>
                        <span>{results.faceDetectionSamples}</span>
                      </div>
                      
                      <div className="mt-3">
                        <span className="font-medium block mb-2">Expression Breakdown:</span>
                        <div className="space-y-1">
                          {Object.entries(results.expressions).map(([emotion, value]) => (
                            <div key={emotion} className="flex justify-between">
                              <span className="capitalize">{emotion}:</span>
                              <span>{(value * 100).toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            How to Use
          </h2>
          <div className="prose text-gray-600">
            <ol className="list-decimal list-inside space-y-2">
              <li>Allow camera access when prompted</li>
              <li>Position your face in front of the camera</li>
              <li>Click "Start Tracking" to begin collecting face detection data</li>
              <li>Make different facial expressions to see real-time detection</li>
              <li>Click "Stop Tracking" to get aggregated results</li>
              <li>Use "Get Current Data" to see current state without stopping</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceDetectionDemo;
