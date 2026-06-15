import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { getCyberTasks } from "../../../services/cyberApi";

const CyberLabList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    loadTasks();
    document.title = "Cyber Practical Labs";
  }, []);

  const loadTasks = async () => {
    try {
      const data = await getCyberTasks();

      console.log("CYBER TASKS RESPONSE:", data);

      let labList = [];

      if (Array.isArray(data)) {
        labList = data;
      } else if (
        data &&
        Array.isArray(data.results)
      ) {
        labList = data.results;
      } else if (
        data &&
        Array.isArray(data.tasks)
      ) {
        labList = data.tasks;
      } else if (
        data &&
        Array.isArray(data.data)
      ) {
        labList = data.data;
      }

      console.log("FINAL LAB LIST:", labList);

      setTasks(labList);

      if (labList.length > 0) {
        Swal.fire({
          icon: "success",
          title: "Cyber Labs Loaded",
          text:
            "All practical labs loaded successfully",
          timer: 1500,
          showConfirmButton: false,
          background: "#101827",
          color: "#fff",
        });
      }
    } catch (err) {
      console.error(
        "CYBER TASK LOAD ERROR:",
        err
      );

      setTasks([]);

      Swal.fire({
        icon: "error",
        title: "Failed",
        text:
          "Unable to load cyber labs",
        background: "#101827",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  const openLab = (taskId) => {
    Swal.fire({
      title: "Open Lab Rules?",
      text:
        "You will first review the cyber lab instructions and rules before starting the practical exam.",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Open Rules",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      background: "#101827",
      color: "#fff",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate(
          `/student/cyber/${taskId}/rules`
        );
      }
    });
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          background:
            "linear-gradient(to bottom right,#020617,#0f172a,#111827)",
          color: "#fff",
        }}
      >
        <div
          className="spinner-border text-light"
          role="status"
        />

        <h4
          style={{
            marginTop: "20px",
          }}
        >
          Loading Cyber Labs...
        </h4>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(to bottom right,#020617,#0f172a,#111827)",
        padding: "30px 15px",
      }}
    >
      <div
        style={{
          maxWidth: "1500px",
          margin: "0 auto 40px auto",
        }}
      >
        <h1
          style={{
            color: "#fff",
            fontWeight: "800",
            fontSize: "clamp(28px,5vw,50px)",
            marginBottom: "10px",
            textAlign: "center",
          }}
        >
          Cyber Security Practical Labs
        </h1>

        <p
          style={{
            color: "#94a3b8",
            textAlign: "center",
            fontSize: "16px",
            maxWidth: "900px",
            margin: "0 auto",
            lineHeight: "1.7",
          }}
        >
          Launch isolated attacker & victim
          virtual lab environments directly
          from your browser with live
          monitoring and automated
          verification.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div
          style={{
            maxWidth: "900px",
            margin: "50px auto",
            background: "#111827",
            borderRadius: "24px",
            padding: "50px",
            textAlign: "center",
            color: "#fff",
          }}
        >
          <h2
            style={{
              marginBottom: "10px",
            }}
          >
            No Cyber Labs Available
          </h2>

          <p
            style={{
              color: "#94a3b8",
            }}
          >
            No active cyber practical labs
            were found.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",
            gap: "25px",
            maxWidth: "1600px",
            margin: "0 auto",
          }}
        >
          {tasks.map((task) => (
            <div
              key={task.id}
              style={{
                background:
                  "linear-gradient(145deg,#0f172a,#111827)",
                border:
                  "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "28px",
                boxShadow:
                  "0 10px 35px rgba(0,0,0,0.45)",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    background:
                      "linear-gradient(to right,#7c3aed,#2563eb)",
                    color: "#fff",
                    padding:
                      "8px 15px",
                    borderRadius:
                      "999px",
                    fontSize: "12px",
                    fontWeight:
                      "700",
                  }}
                >
                  CYBER LAB
                </span>

                <span
                  style={{
                    background:
                      task.difficulty ===
                      "hard"
                        ? "#dc2626"
                        : task.difficulty ===
                            "medium"
                          ? "#d97706"
                          : "#16a34a",
                    color: "#fff",
                    padding:
                      "8px 15px",
                    borderRadius:
                      "999px",
                    fontSize: "12px",
                    fontWeight:
                      "700",
                    textTransform:
                      "uppercase",
                  }}
                >
                  {task.difficulty}
                </span>
              </div>

              <div
                style={{
                  fontSize: "55px",
                  marginBottom: "15px",
                }}
              >
                🛡️
              </div>

              <h2
                style={{
                  color: "#fff",
                  fontWeight: "800",
                  marginBottom: "15px",
                }}
              >
                {task.title}
              </h2>

              <div
                style={{
                  color: "#94a3b8",
                  marginBottom: "10px",
                }}
              >
                Subject:
                {" "}
                {task.subject_name}
              </div>

              <div
                style={{
                  color: "#94a3b8",
                  marginBottom: "20px",
                }}
              >
                Topology:
                {" "}
                {task.topology_name}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginBottom: "25px",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background:
                      "rgba(255,255,255,0.05)",
                    borderRadius:
                      "15px",
                    padding: "15px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    Duration
                  </div>

                  <div
                    style={{
                      color: "#fff",
                      fontWeight:
                        "700",
                    }}
                  >
                    {
                      task.duration_minutes
                    }{" "}
                    Min
                  </div>
                </div>

                <div
                  style={{
                    flex: 1,
                    background:
                      "rgba(255,255,255,0.05)",
                    borderRadius:
                      "15px",
                    padding: "15px",
                  }}
                >
                  <div
                    style={{
                      color:
                        "#64748b",
                    }}
                  >
                    Marks
                  </div>

                  <div
                    style={{
                      color: "#fff",
                      fontWeight:
                        "700",
                    }}
                  >
                    {task.total_marks}
                  </div>
                </div>
              </div>

              <button
                onClick={() =>
                  openLab(task.id)
                }
                style={{
                  width: "100%",
                  border: "none",
                  background:
                    "linear-gradient(to right,#4f46e5,#2563eb)",
                  color: "#fff",
                  padding: "16px",
                  borderRadius: "16px",
                  fontSize: "16px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Launch Cyber Lab
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CyberLabList;