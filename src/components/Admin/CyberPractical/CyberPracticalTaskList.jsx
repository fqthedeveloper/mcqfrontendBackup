import React, {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import Swal from "sweetalert2";

import api from "../../../services/api";

const CyberPracticalTaskList = () => {

  const [tasks, setTasks] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadTasks();

  }, []);

  const loadTasks = async () => {

    try {

      const res = await api.get(
        "/cyber/admin/tasks/"
      );

      setTasks(
        Array.isArray(res)
          ? res
          : res.results || []
      );

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Load Failed",

        text:
          "Unable to load practical tasks",
      });

    } finally {

      setLoading(false);
    }
  };

  const deleteTask = async (id) => {

    const result = await Swal.fire({

      title: "Delete Practical?",

      text:
        "This action cannot be undone.",

      icon: "warning",

      showCancelButton: true,

      confirmButtonColor: "#dc2626",

      cancelButtonColor: "#64748b",

      confirmButtonText: "Yes Delete",

      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {

      Swal.fire({

        title: "Deleting...",

        text:
          "Please wait",

        allowOutsideClick: false,

        didOpen: () => {

          Swal.showLoading();
        },
      });

      await api.delete(
        `/cyber/admin/tasks/${id}/`
      );

      Swal.fire({

        icon: "success",

        title: "Deleted",

        text:
          "Cyber practical deleted successfully",

        timer: 2000,

        showConfirmButton: false,
      });

      loadTasks();

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Delete Failed",

        text:
          err?.detail ||
          "Something went wrong",
      });
    }
  };

  if (loading) {

    return (

      <div style={{

        minHeight: "100vh",

        background: "#020617",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        color: "white",

        fontSize: "24px",
      }}>

        Loading Practicals...

      </div>
    );
  }

  return (

    <>
      {/* ================================================= */}
      {/* INLINE CSS */}
      {/* ================================================= */}

      <style>{`

        .cyber-list-page {

          min-height: 100vh;

          background:
            linear-gradient(
              135deg,
              #020617,
              #0f172a,
              #111827
            );

          padding: 30px 15px;
        }

        .cyber-list-container {

          max-width: 1600px;

          margin: auto;
        }

        .cyber-list-card {

          background:
            rgba(15,23,42,0.96);

          border-radius: 28px;

          overflow: hidden;

          border:
            1px solid rgba(255,255,255,0.06);

          box-shadow:
            0 20px 60px rgba(0,0,0,0.45);
        }

        .cyber-list-header {

          padding: 30px;

          display: flex;

          justify-content: space-between;

          align-items: center;

          flex-wrap: wrap;

          gap: 20px;

          border-bottom:
            1px solid rgba(255,255,255,0.08);
        }

        .cyber-list-header h1 {

          color: white;

          margin: 0;

          font-size: 36px;

          font-weight: 800;
        }

        .cyber-add-btn {

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          color: white;

          text-decoration: none;

          padding: 14px 28px;

          border-radius: 14px;

          font-weight: 700;

          transition: 0.3s;
        }

        .cyber-add-btn:hover {

          transform: translateY(-2px);

          color: white;

          box-shadow:
            0 10px 20px rgba(37,99,235,0.3);
        }

        .cyber-table-wrapper {

          overflow-x: auto;
        }

        .cyber-table {

          width: 100%;

          border-collapse: collapse;
        }

        .cyber-table thead {

          background: #020617;
        }

        .cyber-table th {

          color: white;

          padding: 18px;

          text-align: left;

          font-size: 14px;

          border-bottom:
            1px solid rgba(255,255,255,0.08);
        }

        .cyber-table td {

          color: #cbd5e1;

          padding: 18px;

          border-bottom:
            1px solid rgba(255,255,255,0.05);

          vertical-align: middle;
        }

        .cyber-table tbody tr {

          transition: 0.3s;
        }

        .cyber-table tbody tr:hover {

          background:
            rgba(255,255,255,0.03);
        }

        .cyber-badge-success {

          background: #16a34a;

          padding: 8px 12px;

          border-radius: 30px;

          font-size: 12px;

          font-weight: 700;

          color: white;
        }

        .cyber-badge-draft {

          background: #475569;

          padding: 8px 12px;

          border-radius: 30px;

          font-size: 12px;

          font-weight: 700;

          color: white;
        }

        .cyber-actions {

          display: flex;

          gap: 10px;

          flex-wrap: wrap;
        }

        .cyber-edit-btn {

          background: #2563eb;

          border: none;

          color: white;

          text-decoration: none;

          padding: 10px 14px;

          border-radius: 10px;

          font-size: 13px;

          font-weight: 700;
        }

        .cyber-delete-btn {

          background: #dc2626;

          border: none;

          color: white;

          padding: 10px 14px;

          border-radius: 10px;

          font-size: 13px;

          font-weight: 700;

          cursor: pointer;
        }

        .cyber-empty {

          padding: 60px;

          text-align: center;

          color: #94a3b8;

          font-size: 18px;
        }

        @media (max-width: 992px) {

          .cyber-list-header {

            flex-direction: column;

            align-items: flex-start;
          }

          .cyber-list-header h1 {

            font-size: 28px;
          }
        }

        @media (max-width: 768px) {

          .cyber-table th,
          .cyber-table td {

            padding: 14px;

            font-size: 13px;
          }

          .cyber-add-btn {

            width: 100%;

            text-align: center;
          }
        }

        @media (max-width: 480px) {

          .cyber-list-page {

            padding: 10px;
          }

          .cyber-list-header {

            padding: 20px;
          }

          .cyber-list-header h1 {

            font-size: 22px;
          }

          .cyber-actions {

            flex-direction: column;
          }

          .cyber-edit-btn,
          .cyber-delete-btn {

            width: 100%;

            text-align: center;
          }
        }

      `}</style>

      {/* ================================================= */}
      {/* PAGE */}
      {/* ================================================= */}

      <div className="cyber-list-page">

        <div className="cyber-list-container">

          <div className="cyber-list-card">

            {/* HEADER */}

            <div className="cyber-list-header">

              <h1>
                Cybersecurity Practicals
              </h1>

              <Link
                to="/admin/add-cyber-practical"
                className="cyber-add-btn"
              >
                + Add Practical
              </Link>

            </div>

            {/* TABLE */}

            <div className="cyber-table-wrapper">

              <table className="cyber-table">

                <thead>

                  <tr>

                    <th>ID</th>

                    <th>Title</th>

                    <th>Subject</th>

                    <th>Difficulty</th>

                    <th>Topology</th>

                    <th>Marks</th>

                    <th>Duration</th>

                    <th>Status</th>

                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {tasks.length === 0 ? (

                    <tr>

                      <td
                        colSpan="9"
                        className="cyber-empty"
                      >

                        No Cyber Practicals Found

                      </td>

                    </tr>

                  ) : (

                    tasks.map((task) => (

                      <tr key={task.id}>

                        <td>{task.id}</td>

                        <td>
                          {task.title}
                        </td>

                        <td>
                          {task.subject_name}
                        </td>

                        <td>
                          {task.difficulty}
                        </td>

                        <td>
                          {task.topology_name}
                        </td>

                        <td>
                          {task.total_marks}
                        </td>

                        <td>
                          {
                            task.duration_minutes
                          } mins
                        </td>

                        <td>

                          {
                            task.is_published
                              ? (
                                <span className="
                                  cyber-badge-success
                                ">
                                  Published
                                </span>
                              )
                              : (
                                <span className="
                                  cyber-badge-draft
                                ">
                                  Draft
                                </span>
                              )
                          }

                        </td>

                        <td>

                          <div className="
                            cyber-actions
                          ">

                            <Link
                                to={`/admin/edit-cyber-practical/${task.id}`}
                                className="cyber-edit-btn"
                                >
                                Edit
                                </Link>

                            <button
                              className="
                                cyber-delete-btn
                              "
                              onClick={() =>
                                deleteTask(task.id)
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      </div>

    </>
  );
};

export default CyberPracticalTaskList;