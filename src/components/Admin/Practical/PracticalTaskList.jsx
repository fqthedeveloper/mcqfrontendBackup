import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import PracticalTaskForm from "./PracticalTaskForm";
import "./practical.css";

const PracticalTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const loadTasks = () => {
    api.get("/practical/tasks/")
      .then((res) => {
        setTasks(res || []);
        if (!res || res.length === 0) {
          Swal.fire("Info", "No practical tasks found", "info");
        }
      })
      .catch(() => {
        Swal.fire("Error", "Failed to load practical tasks", "error");
      });
  };

  useEffect(() => {
    loadTasks();
    document.title = "Practical Tasks - Admin";
  }, []);

  const handleEdit = (task) => {
    setSelectedTask(task);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="page-container">
      <PracticalTaskForm
        selectedTask={selectedTask}
        onSuccess={() => {
          setSelectedTask(null);
          loadTasks();
        }}
      />

      <div className="card">
        <h3 className="card-title">All Practical Tasks</h3>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Subject</th>
                <th>Published</th>
                <th>Active</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.subject_name}</td>
                  <td>{t.is_published ? "Yes" : "No"}</td>
                  <td>{t.is_active ? "Yes" : "No"}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => handleEdit(t)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {tasks.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty">
                    No practical tasks available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PracticalTaskList;
