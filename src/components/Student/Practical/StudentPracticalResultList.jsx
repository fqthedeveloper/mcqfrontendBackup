import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";

export default function StudentPracticalResultList() {

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    practicalService.getStudentResults()
      .then(data => {
        // data is already response.data from axios wrapper
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error(err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Set page title
    document.title = "My Practical Results";
  }, []);

  if (loading) {
    return <div style={{ padding: 30 }}>Loading...</div>;
  }

  return (
    <div className="container">
      <h2>My Practical Results</h2>

      {results.length === 0 ? (
        <p>No results available.</p>
      ) : (
        <div className="grid">
          {results.map((r) => (
            <div key={r.id} className="card">
              <h3>{r.task_title}</h3>
              <p>Marks: {r.marks} / {r.total_marks}</p>
              <p>Percentage: {r.percentage}%</p>
              <p>VM: {r.vm_name}</p>

              <button
                onClick={() =>
                  navigate(`/student/practical/result/${r.id}`)
                }
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .container { padding: 30px; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .card {
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #ddd;
          background: white;
        }

        button {
          margin-top: 10px;
          padding: 8px 14px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        button:hover {
          background: #0056b3;
        }

        @media(max-width:768px){
          .grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
