import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";

export default function StudentPracticalResult() {

  const { sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [fileContent, setFileContent] = useState("");

  useEffect(() => {
    practicalService.getResultDetail(sessionId)
      .then(data => {
        setResult(data);
      })
      .catch(err => console.error(err));
  }, [sessionId]);

  const openFile = (path) => {
    practicalService.getHistoryFile(sessionId, path)
      .then(data => {
        setFileContent(data.content);
      })
      .catch(err => console.error(err));
  };

  if (!result) return <div style={{ padding: 30 }}>Loading...</div>;

  return (
    <div className="container">

      <h2>{result.task_title}</h2>

      <div className="info">
        <p><strong>Student:</strong> {result.student}</p>
        <p>Marks: {result.marks} / {result.total_marks}</p>
        <p>Percentage: {result.percentage}%</p>
        <p>VM Name: {result.vm_name}</p>
      </div>

      <hr />

      <div className="layout">
        <div className="files">
          <h4>History Files</h4>

          {result.history_files && result.history_files.length > 0 ? (
            result.history_files.map((f, i) => (
              <div key={i} onClick={() => openFile(f.name)}>
                {f.name}
              </div>
            ))
          ) : (
            <p>No history files found.</p>
          )}
        </div>

        <div className="content">
          <pre>{fileContent || "Select a file to view"}</pre>
        </div>
      </div>

      <style>{`
        .container { padding: 30px; }

        .layout {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
        }

        .files {
          flex: 1;
          min-width: 250px;
          border: 1px solid #ddd;
          padding: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .files div {
          padding: 6px;
          cursor: pointer;
        }

        .files div:hover {
          background: #f0f0f0;
        }

        .content {
          flex: 2;
          min-width: 300px;
          background: #111;
          color: #0f0;
          padding: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        @media(max-width:768px){
          .layout { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
