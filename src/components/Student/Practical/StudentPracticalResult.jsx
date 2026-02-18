import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";

export default function StudentPracticalResult() {

  const { sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("raw");
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    practicalService.getResultDetail(sessionId)
      .then(data => setResult(data))
      .catch(err => console.error(err));
  }, [sessionId]);

  useEffect(() => {
    if (!result) return;

    let start = 0;
    const end = result.percentage;
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setAnimatedPercentage(Math.round(start));
    }, 16);

    return () => clearInterval(timer);
  }, [result]);

  useEffect(() => {
    if (result) {
      document.title = `Result - ${result.task_title}`;
    }
  }, [result]);

  if (!result) return <div className="loading">Loading...</div>;

  const passed = result.percentage >= 80;

  const radius = 65;
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (animatedPercentage / 100) * circumference;

  return (
    <div className="page">

      <div className="card">

        <h2 className="title">{result.task_title}</h2>

        <div className="info">
          <div><strong>Student:</strong> {result.student}</div>
          <div><strong>Marks:</strong> {result.marks} / {result.total_marks}</div>
          <div><strong>VM:</strong> {result.vm_name}</div>
        </div>

        {/* Progress */}
        <div className="progress-wrapper">

          <div className="circle">
            <svg height={radius * 2} width={radius * 2}>
              <circle
                stroke="#e5e7eb"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={passed ? "#16c784" : "#ff3b3b"}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 0.4s ease" }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>

            <div className="circle-text">
              <div className="percent">{animatedPercentage}%</div>
              <br />
              <div className={`badge ${passed ? "pass" : "fail"}`}>
                {passed ? "PASS" : "FAIL"}
              </div>
            </div>
          </div>

        </div>

        {/* Tabs */}
        <div className="tabs">
          <button
            className={activeTab === "raw" ? "active" : ""}
            onClick={() => setActiveTab("raw")}
          >
            Raw Output
          </button>
        </div>

        {/* Raw Output */}
        {activeTab === "raw" && (
          <div className="terminal">
            <pre>{result.raw_output || "No output available."}</pre>
          </div>
        )}

      </div>

      <style>{`

        .page {
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg,#eef2f7,#f8fafc);
          display: flex;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 850px;
          background: white;
          padding: 25px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .title {
          text-align: center;
          font-size: 20px;
          margin-bottom: 18px;
        }

        .info {
          text-align: center;
          font-size: 14px;
          line-height: 1.8;
        }

        .progress-wrapper {
          margin-top: 25px;
          display: flex;
          justify-content: center;
        }

        .circle {
          position: relative;
          width: 140px;
          height: 140px;
        }

        .circle-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%);
          text-align: center;
        }

        .percent {
          font-size: 22px;
          font-weight: bold;
        }

        .badge {
          margin-top: -12px;
          font-size: 11px;
          padding: 4px 10px;
          border-radius: 6px;
          color: white;
          font-weight: bold;
        }

        .pass { background:#16c784; }
        .fail { background:#ff3b3b; }

        .tabs {
          margin-top: 25px;
          display: flex;
          justify-content: center;
        }

        .tabs button {
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          background: #2563eb;
          color: white;
          cursor: pointer;
          font-size: 13px;
        }

        .terminal {
          margin-top: 25px;
          background: #0f172a;
          color: #00ff90;
          padding: 20px;
          border-radius: 12px;
          font-family: monospace;
          font-size: 13px;
          overflow-x: auto;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
        }

        .loading {
          padding: 60px;
          text-align: center;
        }

        @media (min-width: 768px) {
          .title { font-size: 24px; }
          .circle { width: 160px; height: 160px; }
        }

        @media (min-width: 1024px) {
          .title { font-size: 28px; }
        }

      `}</style>

    </div>
  );
}
