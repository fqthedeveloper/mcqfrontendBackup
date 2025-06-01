// src/components/Shared/Timer.js
import React, { useEffect } from 'react';
import '../CSS/Exam.css';

export default function Timer({ remainingSeconds, onTimeUp, simple = false, totalTime }) {
  useEffect(() => {
    if (remainingSeconds <= 0) {
      onTimeUp?.();
    }
  }, [remainingSeconds, onTimeUp]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (totalTime <= 0) return 100;
    const progress = (remainingSeconds / totalTime) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  if (simple) {
    return (
      <span className="simple-timer">
        {remainingSeconds > 0 ? formatTime(remainingSeconds) : "00:00"}
      </span>
    );
  }

  return (
    <div className="timer">
      <div className="time-left">{formatTime(remainingSeconds)}</div>
      <div className="timer-progress">
        <div 
          className="timer-progress-bar" 
          style={{ width: `${calculateProgress()}%` }}
        ></div>
      </div>
    </div>
  );
}