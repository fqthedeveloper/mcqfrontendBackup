import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";

export default function AdminPracticalResultList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    practicalService
      .getAdminResults()
      .then((data) => {
        if (Array.isArray(data)) {
          setResults(data);
        } else {
          setResults([]);
        }
      })
      .catch((err) => {
        console.error(err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = "All Student Practical Results";
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <h3>Loading...</h3>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <h2 className="page-title">All Student Practical Results</h2>

      {results.length === 0 ? (
        <p className="empty-text">No results found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="result-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Task Title</th>
                <th>Student</th>
                <th>Marks</th>
                <th>Percentage</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, index) => (
                <tr key={r.id}>
                  <td>{index + 1}</td>
                  <td>{r.task_title}</td>
                  <td>{r.student}</td>
                  <td>
                    {r.marks} / {r.total_marks}
                  </td>
                  <td>
                    <span
                      className={
                        r.percentage >= 50
                          ? "percentage-pass"
                          : "percentage-fail"
                      }
                    >
                      {r.percentage}%
                    </span>
                  </td>
                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        navigate(`/student/practical/result/${r.id}`)
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen;
          background: #f4f6f9;
        }

        .admin-container {
          max-width: 1400px;
          margin: auto;
          padding: 40px 20px;
        }

        .page-title {
          text-align: center;
          margin-bottom: 30px;
          font-size: 28px;
          font-weight: 600;
          color: #2c3e50;
        }

        .loading-container {
          padding: 50px;
          text-align: center;
        }

        .empty-text {
          text-align: center;
          color: #777;
        }

        .table-wrapper {
          width: 100%;
          overflow-x: auto;
          background: white;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .result-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .result-table thead {
          background: #1e90ff;
          color: white;
        }

        .result-table th,
        .result-table td {
          padding: 14px 16px;
          text-align: left;
          font-size: 14px;
        }

        .result-table th {
          font-weight: 600;
        }

        .result-table tbody tr {
          border-bottom: 1px solid #eee;
          transition: background 0.2s ease;
        }

        .result-table tbody tr:hover {
          background: #f8f9fa;
        }

        .percentage-pass {
          color: #28a745;
          font-weight: 600;
        }

        .percentage-fail {
          color: #dc3545;
          font-weight: 600;
        }

        .view-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          background: #007bff;
          color: white;
          font-size: 13px;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .view-btn:hover {
          background: #0056b3;
        }

        /* Tablet */
        @media (max-width: 1024px) {
          .admin-container {
            padding: 30px 15px;
          }

          .page-title {
            font-size: 24px;
          }
        }

        /* Mobile */
        @media (max-width: 600px) {
          .admin-container {
            padding: 20px 10px;
          }

          .page-title {
            font-size: 20px;
          }

          .result-table th,
          .result-table td {
            padding: 10px;
            font-size: 13px;
          }

          .view-btn {
            padding: 5px 10px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
