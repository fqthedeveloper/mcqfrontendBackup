import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import PracticalTaskForm from "./PracticalTaskForm";

const PracticalTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = () => {
    api.get("/practical/tasks/")
      .then((res) => setTasks(res || []))
      .catch(() =>
        Swal.fire("Error", "Failed to load practical tasks", "error")
      );
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleEdit = (task) => {
    setSelectedTask(task);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={pageWrapper}>
      <div style={container}>
        <PracticalTaskForm
          selectedTask={selectedTask}
          onSuccess={() => {
            setSelectedTask(null);
            loadTasks();
          }}
        />

        <div style={card}>
          <h2 style={{ marginBottom: 20 }}>All Practical Tasks</h2>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr style={thead}>
                  <th style={th}>Title</th>
                  <th style={th}>Subject</th>
                  <th style={th}>Published</th>
                  <th style={th}>Active</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td style={td}>{t.title}</td>
                    <td style={td}>{t.subject_name}</td>
                    <td style={td}>{t.is_published ? "Yes" : "No"}</td>
                    <td style={td}>{t.is_active ? "Yes" : "No"}</td>
                    <td style={td}>
                      <button
                        style={button}
                        onClick={() => handleEdit(t)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* STYLES */

const pageWrapper = {
  width: "100%",
  background: "#f3f4f6",
};

const container = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  padding: "40px 20px",
  boxSizing: "border-box",
};

const card = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "30px",
  marginTop: "40px",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};

const thead = {
  background: "#f3f4f6",
};

const th = {
  padding: "14px",
  textAlign: "left",
  fontWeight: "600",
  borderBottom: "1px solid #e5e7eb",
};

const td = {
  padding: "14px",
  borderBottom: "1px solid #e5e7eb",
};

const button = {
  padding: "6px 12px",
  borderRadius: "6px",
  border: "none",
  background: "#2563eb",
  color: "#ffffff",
  cursor: "pointer",
};

export default PracticalTaskList;
