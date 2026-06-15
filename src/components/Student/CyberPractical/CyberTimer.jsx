import React from "react";

const CyberTimer = ({ seconds }) => {

  const hrs = Math.floor(seconds / 3600);

  const mins = Math.floor((seconds % 3600) / 60);

  const secs = seconds % 60;

  return (
    <div className="badge bg-danger fs-6 p-3">
      {hrs}:{mins}:{secs}
    </div>
  );
};

export default CyberTimer;