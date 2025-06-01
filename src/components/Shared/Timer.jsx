import React, { useState, useEffect } from 'react';
import { formatTime } from './timeUtils';

export default function Timer({ duration, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, onTimeUp]);

  return (
    <div className="timer">
      Time Remaining: {formatTime(timeLeft)}
    </div>
  );
}