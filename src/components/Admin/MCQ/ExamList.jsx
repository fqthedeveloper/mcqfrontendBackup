import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mcqService } from "../../../services/mcqService";

export default function AdminExamList() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    mcqService.getExams().then(setExams);
  }, []);

  return (
    <div>
      <h2>MCQ Exams</h2>
      {exams.map((e) => (
        <div key={e.id}>
          <strong>{e.title}</strong> – {e.is_published ? "Published" : "Draft"}
          <button onClick={() => navigate(`/admin/exams/${e.id}/edit`)}>
            Edit
          </button>
        </div>
      ))}
    </div>
  );
}
