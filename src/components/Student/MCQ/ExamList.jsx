import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mcqService } from "../../../services/mcqService";

const normalize = (data) => {
  if (Array.isArray(data)) return data;
  if (data?.results) return data.results;
  return [];
};

export default function ExamList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Available Exams";
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const data = await mcqService.getExams();
      setExams(normalize(data));
    } catch {
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (examId) => {
    try {
      const session = await mcqService.createSession(examId);

      if (!session || !session.id) {
        throw new Error("Session ID missing");
      }

      // ✅ MUST MATCH ROUTE PARAM NAME
      navigate(`/student/exam/${session.id}`);
    } catch {
      setError("Unable to start exam");
    }
  };

  if (loading) return <div className="exam-loading">Loading…</div>;

  return (
    <div className="exam-page">
      <h1 className="title">Available Exams</h1>

      {error && <div className="exam-error">{error}</div>}

      {exams.length === 0 && (
        <div className="exam-empty">
          No exams available for your subjects
        </div>
      )}

      <div className="exam-grid">
        {exams.map((exam) => (
          <div className="exam-card" key={exam.id}>
            <h3>{exam.title}</h3>
            <p><b>Duration:</b> {exam.duration} min</p>
            <p><b>Questions:</b> {exam.question_count}</p>
            <p><b>Mode:</b> {exam.mode}</p>

            <button onClick={() => startExam(exam.id)}>
              Start Exam
            </button>
          </div>
        ))}
      </div>
      <div className="exam-notes">
        <h4>⚠ Important Notes</h4>
        <ul>
          <li>Timer runs continuously</li>
          <li>No multiple attempts</li>
          <li>Auto-submit on time end</li>
          <li>Do not refresh page</li>
        </ul>
      </div>

      <style>{`
        .exam-page {
          max-width: 1200px;
          margin: auto;
          padding: 20px;
        }
        .title {
          font-size: 32px;
          margin-bottom: 20px;
        }
        .exam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .exam-card {
          background: #fff;
          padding: 18px;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,.1);
        }
        .exam-card button {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #2563eb;
          color: white;
        }
        .exam-empty {
          padding: 20px;
          background: #fef2f2;
          border-radius: 12px;
        }
      `}</style>
    </div>
  );
}
