"use client";
import { useState, useCallback } from 'react';

export const useFaceDetection = () => {
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

  const [aggregatedData, setAggregatedData] = useState({
    samples: [],
    startTime: null,
    isActive: false
  });


  // Process individual face detection data
  const processFaceData = useCallback((newFaceData) => {
    setFaceData(newFaceData);
    
    if (newFaceData.isDetected) {
      setAggregatedData(prev => ({
        ...prev,
        samples: [...prev.samples, {
          confidence: newFaceData.confidence,
          expressions: newFaceData.expressions,
          faceCount: newFaceData.faceCount || 0,
          isLookingAway: newFaceData.isLookingAway || false,
          isGazeAway: newFaceData.isGazeAway || false,
          timestamp: newFaceData.timestamp
        }]
      }));
    }
  }, []);

  // Start face detection tracking
  const startTracking = useCallback(() => {
    setAggregatedData(prev => ({
      ...prev,
      startTime: Date.now(),
      isActive: true,
      samples: []
    }));
  }, []);

  // Stop face detection tracking and return aggregated data
  const stopTracking = useCallback(() => {
    const { samples, startTime } = aggregatedData;
    const endTime = Date.now();
    
    if (samples.length === 0) {
      return {
        isDetected: false,
        averageConfidence: 0,
        expressions: {},
        dominantExpression: 'neutral',
        faceDetectionDuration: 0,
        faceDetectionSamples: 0,
        multiPersonRatio: 0,
        lookingAwayRatio: 0,
        gazeAwayRatio: 0,
      };
    }

    // Calculate average confidence
    const averageConfidence = samples.reduce((sum, sample) => sum + sample.confidence, 0) / samples.length;

    // Calculate average expressions
    const expressionKeys = Object.keys(samples[0].expressions);
    const averageExpressions = {};
    
    expressionKeys.forEach(expression => {
      const avgValue = samples.reduce((sum, sample) => sum + (sample.expressions[expression] || 0), 0) / samples.length;
      averageExpressions[expression] = avgValue;
    });

    // Find dominant expression
    const dominantExpression = Object.entries(averageExpressions)
      .reduce((max, [expression, value]) => value > max.value ? { expression, value } : max, { expression: 'neutral', value: 0 })
      .expression;

    // Additional analytics
    const lookingAwayRatio = samples.filter(s => s.isLookingAway).length / samples.length;
    const multiPersonRatio = samples.filter(s => (s.faceCount || 0) > 1).length / samples.length;
    const gazeAwayRatio = samples.filter(s => s.isGazeAway).length / samples.length;

    const result = {
      isDetected: true,
      averageConfidence,
      expressions: averageExpressions,
      dominantExpression,
      faceDetectionDuration: endTime - startTime,
      faceDetectionSamples: samples.length,
      lookingAwayRatio,
      multiPersonRatio,
      gazeAwayRatio
    };

    setAggregatedData(prev => ({
      ...prev,
      isActive: false,
      samples: []
    }));

    return result;
  }, [aggregatedData]);

  // Get current aggregated data without stopping
  const getCurrentData = useCallback(() => {
    const { samples, startTime } = aggregatedData;
    
    if (samples.length === 0) {
      return {
        isDetected: false,
        averageConfidence: 0,
        expressions: {},
        dominantExpression: 'neutral',
        faceDetectionDuration: 0,
        faceDetectionSamples: 0,
        multiPersonRatio: 0,
        lookingAwayRatio: 0,
        gazeAwayRatio: 0,
      };
    }

    const currentTime = Date.now();
    const averageConfidence = samples.reduce((sum, sample) => sum + sample.confidence, 0) / samples.length;

    const expressionKeys = Object.keys(samples[0].expressions);
    const averageExpressions = {};
    
    expressionKeys.forEach(expression => {
      const avgValue = samples.reduce((sum, sample) => sum + (sample.expressions[expression] || 0), 0) / samples.length;
      averageExpressions[expression] = avgValue;
    });

    const dominantExpression = Object.entries(averageExpressions)
      .reduce((max, [expression, value]) => value > max.value ? { expression, value } : max, { expression: 'neutral', value: 0 })
      .expression;

    return {
      isDetected: true,
      averageConfidence,
      expressions: averageExpressions,
      dominantExpression,
      faceDetectionDuration: startTime ? currentTime - startTime : 0,
      faceDetectionSamples: samples.length,
      lookingAwayRatio: samples.filter(s => s.isLookingAway).length / samples.length,
      multiPersonRatio: samples.filter(s => (s.faceCount || 0) > 1).length / samples.length,
      gazeAwayRatio: samples.filter(s => s.isGazeAway).length / samples.length
    };
  }, [aggregatedData]);

  return {
    faceData,
    aggregatedData,
    processFaceData,
    startTracking,
    stopTracking,
    getCurrentData
  };
};
