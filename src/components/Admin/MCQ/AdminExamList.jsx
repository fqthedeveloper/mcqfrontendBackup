import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";

/* ================= SAFE NORMALIZER ================= */
const normalizeArray = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : [];

/* ================= COMPONENT ================= */

export default function AdminExamList() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await authGet("/mcq/exams/");
      setExams(normalizeArray(res));
    } catch {
      setError("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PUBLISH / UNPUBLISH ================= */

  const togglePublish = async (exam) => {
    const confirm = await Swal.fire({
      title: exam.is_published ? "Unpublish Exam?" : "Publish Exam?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
    });

    if (!confirm.isConfirmed) return;

    try {
      await authPost(`/mcq/exams/${exam.id}/${exam.is_published ? "unpublish" : "publish"}/`);

      setExams((prev) =>
        prev.map((e) =>
          e.id === exam.id
            ? { ...e, is_published: !e.is_published }
            : e
        )
      );

      Swal.fire("Success", "Status updated", "success");
    } catch {
      Swal.fire("Error", "Failed to update exam", "error");
    }
  };

  /* ================= STATES ================= */

  if (loading) return <div className="page-center">Loading exams…</div>;
  if (error) return <div className="page-center error">{error}</div>;
  if (!exams.length) return <div className="page-center">No exams found</div>;

  /* ================= RENDER ================= */

  return (
    <div className="exam-page">
      <h1 className="page-title">Exam Management</h1>

      <div className="exam-grid">
        {exams.map((exam) => (
          <div className="exam-card" key={exam.id}>
            <div className="exam-header">
              <h3>{exam.title}</h3>
              <span className={`badge ${exam.is_published ? "published" : "draft"}`}>
                {exam.is_published ? "Published" : "Draft"}
              </span>
            </div>

            <div className="exam-body">
              <p><strong>Subject:</strong> {exam.subject_name}</p>
              <p><strong>Questions:</strong> {exam.question_count}</p>
              <p><strong>Duration:</strong> {exam.duration} min</p>
              <p><strong>Mode:</strong> {exam.mode}</p>
              <p><strong>Created:</strong> {new Date(exam.created_at).toLocaleDateString()}</p>
            </div>

            <div className="exam-actions">
              <button
                className="btn edit"
                onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
              >
                ✏️ Edit
              </button>

              <button
                className={`btn ${exam.is_published ? "unpublish" : "publish"}`}
                onClick={() => togglePublish(exam)}
              >
                {exam.is_published ? "🚫 Unpublish" : "🚀 Publish"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ================= CSS ================= */}
      <style>{`
        .exam-page {
          padding: 24px;
          max-width: 1200px;
          margin: auto;
        }

        .exam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .exam-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,.08);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .exam-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .badge.published {
          background: #dcfce7;
          color: #166534;
        }

        .badge.draft {
          background: #fee2e2;
          color: #991b1b;
        }

        .exam-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .btn {
          flex: 1;
          border: none;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          color: #fff;
        }

        .btn.edit { background: #2563eb; }
        .btn.publish { background: #16a34a; }
        .btn.unpublish { background: #dc2626; }
      `}</style>
    </div>
  );
}
