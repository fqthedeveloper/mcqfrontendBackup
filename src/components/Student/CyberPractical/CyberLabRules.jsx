import React, {
  useEffect,
  useState,
  useRef,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import {

  getCyberTaskDetail,
  startCyberLab,
  getActiveCyberSession,

} from "../../../services/cyberApi";


const CyberLabRules = () => {

  const { taskId } = useParams();

  const navigate = useNavigate();

  const [task, setTask] = useState(null);

  const [loading, setLoading] = useState(true);

  const [starting, setStarting] = useState(false);

  const startedRef = useRef(false);

  const [activeSession,setActiveSession] = useState(null);


  // =====================================================
  // LOAD TASK
  // =====================================================

  useEffect(() => {

    loadTask();

  }, []);


const loadTask = async () => {

    try {

        const data =
            await getCyberTaskDetail(taskId);

        setTask(data);

        const existing =
            await getActiveCyberSession();

        console.log(
            "ACTIVE SESSION =>",
            existing
        );

        if (
            existing?.active === true &&
            existing?.session
        ) {

            setActiveSession(
                existing.session
            );
        }

    }
    catch (err) {

        console.error(err);

    }
    finally {

        setLoading(false);

    }

};

  // =====================================================
  // START LAB
  // =====================================================

  const handleStartLab = async () => {

    if (starting)
      return;

    if (startedRef.current)
      return;

    const result = await Swal.fire({

      title: "Start Cyber Lab?",

      text:
        "A secure isolated exam environment will now be created for you.",

      icon: "warning",

      showCancelButton: true,

      confirmButtonText: "Start Lab",

      cancelButtonText: "Cancel",

      confirmButtonColor: "#2563eb",

      background: "#0f172a",

      color: "#fff",
    });

    if (!result.isConfirmed)
      return;

    startedRef.current = true;

    setStarting(true);

    try {

      Swal.fire({

        title: "Creating Cyber Lab",

        html: `
          <div style="padding-top:15px">

            <div style="
              width:100%;
              height:16px;
              background:#1e293b;
              border-radius:999px;
              overflow:hidden;
              margin-bottom:20px;
            ">

              <div style="
                width:100%;
                height:100%;
                background:linear-gradient(to right,#7c3aed,#2563eb);
                animation: progress 2s infinite;
              ">
              </div>

            </div>

            <div style="
              color:#cbd5e1;
              font-size:15px;
              line-height:1.8;
            ">
              Preparing isolated attacker environment...
              <br/>
              Starting secure examination topology...
            </div>

          </div>

          <style>
            @keyframes progress {
              0% {
                transform:translateX(-100%);
              }
              100% {
                transform:translateX(100%);
              }
            }
          </style>
        `,

        allowOutsideClick: false,

        showConfirmButton: false,

        background: "#0f172a",

        color: "#fff",
      });

      let session;

try {

    session =
    await startCyberLab(task.id);

      }
      catch(err){

          if(

              err?.response?.data?.error ===
              "Exam already running"

          ){

              const existing =
              await getActiveCyberSession();

              if(

                  existing.active &&
                  existing.session

              ){

                  navigate(

                    `/student/cyber/session/${existing.session.id}`

                  );

                  return;
              }
          }

          throw err;
      }

      Swal.close();

      await Swal.fire({

        icon: "success",

        title: "Cyber Lab Ready",

        text:
          "Your isolated cyber security environment is ready.",

        timer: 1800,

        showConfirmButton: false,

        background: "#0f172a",

        color: "#fff",
      });

      navigate(

        `/student/cyber/session/${session.id}`
      );

    } catch (err) {

      console.error(err);

      startedRef.current = false;

      setStarting(false);

      Swal.fire({

        icon: "error",

        title: "Lab Start Failed",

        text:
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.message ||
          "Unable to create cyber lab",

        background: "#0f172a",

        color: "#fff",
      });
    }
  };


  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (

      <div
        style={{
          minHeight: "100vh",

          background: "#020617",

          display: "flex",

          justifyContent: "center",

          alignItems: "center",

          color: "#fff",

          fontSize: "24px",

          fontWeight: "800",
        }}
      >
        Loading Cyber Lab...
      </div>
    );
  }


  // =====================================================
  // UI
  // =====================================================

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
          maxWidth: "1400px",

          margin: "0 auto",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            marginBottom: "35px",
          }}
        >

          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "center",

              flexWrap: "wrap",

              gap: "15px",

              marginBottom: "20px",
            }}
          >

            <div
              style={{
                background:
                  "linear-gradient(to right,#7c3aed,#2563eb)",

                color: "#fff",

                padding: "10px 18px",

                borderRadius: "999px",

                fontWeight: "800",

                fontSize: "13px",

                letterSpacing: "1px",
              }}
            >
              CYBER SECURITY EXAM
            </div>

            <div
              style={{
                background:
                  task.difficulty === "hard"
                    ? "#dc2626"
                    : task.difficulty === "medium"
                    ? "#d97706"
                    : "#16a34a",

                color: "#fff",

                padding: "10px 18px",

                borderRadius: "999px",

                fontWeight: "800",

                textTransform: "uppercase",

                fontSize: "13px",
              }}
            >
              {task.difficulty}
            </div>

          </div>

          <h1
            style={{
              color: "#fff",

              fontWeight: "900",

              fontSize: "clamp(32px,5vw,55px)",

              lineHeight: "1.3",

              marginBottom: "18px",
            }}
          >
            {task.title}
          </h1>

          <p
            style={{
              color: "#94a3b8",

              fontSize: "17px",

              lineHeight: "1.9",

              maxWidth: "1000px",
            }}
          >
            Carefully review all instructions and rules before launching your isolated cyber security examination environment.
          </p>

        </div>


        {/* GRID */}

        <div
          style={{
            display: "grid",

            gridTemplateColumns:
              "repeat(auto-fit,minmax(350px,1fr))",

            gap: "28px",
          }}
        >

          {/* DESCRIPTION */}

          <div
            style={{
              background:
                "linear-gradient(145deg,#111827,#1e293b)",

              border:
                "1px solid rgba(255,255,255,0.08)",

              borderRadius: "28px",

              padding: "35px",

              boxShadow:
                "0 10px 40px rgba(0,0,0,0.45)",
            }}
          >

            <h2
              style={{
                color: "#fff",

                marginBottom: "25px",

                fontWeight: "800",
              }}
            >
              Lab Overview
            </h2>

            <div
              style={{
                color: "#cbd5e1",

                lineHeight: "1.9",

                fontSize: "15px",
              }}

              dangerouslySetInnerHTML={{
                __html: task.description,
              }}
            />

          </div>


          {/* RULES */}

          <div
            style={{
              display: "flex",

              flexDirection: "column",

              gap: "25px",
            }}
          >

            <div
              style={{
                background:
                  "linear-gradient(145deg,#111827,#1e293b)",

                border:
                  "1px solid rgba(255,255,255,0.08)",

                borderRadius: "28px",

                padding: "35px",

                boxShadow:
                  "0 10px 40px rgba(0,0,0,0.45)",
              }}
            >

              <h2
                style={{
                  color: "#fff",

                  marginBottom: "25px",

                  fontWeight: "800",
                }}
              >
                Rules & Restrictions
              </h2>

              <div
                style={{
                  display: "flex",

                  flexDirection: "column",

                  gap: "18px",
                }}
              >

                {[
                  "Only one session allowed per student",

                  "Internet access is blocked inside lab",

                  "All activity is monitored",

                  "Browser refresh may disconnect session",

                  "Sharing flags or credentials is prohibited",

                  "Lab auto terminates after timeout",

                  "Attacking external systems is forbidden",
                ].map((rule, index) => (

                  <div
                    key={index}
                    style={{
                      display: "flex",

                      gap: "14px",

                      alignItems: "flex-start",

                      background:
                        "rgba(255,255,255,0.04)",

                      border:
                        "1px solid rgba(255,255,255,0.05)",

                      padding: "18px",

                      borderRadius: "18px",
                    }}
                  >

                    <div
                      style={{
                        color: "#22c55e",

                        fontSize: "18px",

                        fontWeight: "800",
                      }}
                    >
                      ✓
                    </div>

                    <div
                      style={{
                        color: "#cbd5e1",

                        lineHeight: "1.7",

                        fontSize: "15px",
                      }}
                    >
                      {rule}
                    </div>

                  </div>
                ))}

              </div>

            </div>


            {/* INFO */}

            <div
              style={{
                display: "grid",

                gridTemplateColumns:
                  "repeat(2,minmax(140px,1fr))",

                gap: "18px",
              }}
            >

              <div
                style={{
                  background:
                    "linear-gradient(145deg,#111827,#1e293b)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  borderRadius: "22px",

                  padding: "25px",

                  textAlign: "center",
                }}
              >

                <div
                  style={{
                    color: "#64748b",

                    marginBottom: "10px",

                    fontSize: "14px",
                  }}
                >
                  Duration
                </div>

                <div
                  style={{
                    color: "#fff",

                    fontWeight: "900",

                    fontSize: "30px",
                  }}
                >
                  {task.duration_minutes}
                </div>

                <div
                  style={{
                    color: "#94a3b8",

                    marginTop: "5px",

                    fontSize: "14px",
                  }}
                >
                  Minutes
                </div>

              </div>


              <div
                style={{
                  background:
                    "linear-gradient(145deg,#111827,#1e293b)",

                  border:
                    "1px solid rgba(255,255,255,0.08)",

                  borderRadius: "22px",

                  padding: "25px",

                  textAlign: "center",
                }}
              >

                <div
                  style={{
                    color: "#64748b",

                    marginBottom: "10px",

                    fontSize: "14px",
                  }}
                >
                  Total Marks
                </div>

                <div
                  style={{
                    color: "#fff",

                    fontWeight: "900",

                    fontSize: "30px",
                  }}
                >
                  {task.total_marks}
                </div>

                <div
                  style={{
                    color: "#94a3b8",

                    marginTop: "5px",

                    fontSize: "14px",
                  }}
                >
                  Points
                </div>

              </div>

            </div>

            {/* BUTTONS */}

            <div
                style={{
                    color: "#fff",
                    marginBottom: "20px",
                    fontSize: "20px",
                    fontWeight: "bold",
                }}
            >
                ACTIVE SESSION =
                {
                    activeSession
                        ? activeSession.id
                        : "NONE"
                }
            </div>

              {activeSession ? (

                <div>

                  <div
                    style={{
                      color: "white",
                      marginBottom: "15px"
                    }}
                  >
                    Session:
                    {
                      activeSession
                        ? activeSession.id
                        : "None"
                    }
                  </div>

                  <button

                    onClick={() =>
                      navigate(
                        `/student/cyber/session/${activeSession.id}`
                      )
                    }

                    style={{

                      width: "100%",

                      border: "none",

                      background:
                        "linear-gradient(to right,#16a34a,#22c55e)",

                      color: "#fff",

                      padding: "20px",

                      borderRadius: "22px",

                      fontSize: "18px",

                      fontWeight: "800",

                      cursor: "pointer",

                      transition: "0.3s",

                      boxShadow:
                        "0 10px 35px rgba(34,197,94,0.35)",
                    }}
                  >
                    Resume Cyber Security Exam
                  </button>

                </div>

              ) : (

                <button

                  disabled={starting}

                  onClick={handleStartLab}

                  style={{

                    width: "100%",

                    border: "none",

                    background:
                      starting
                        ? "#334155"
                        : "linear-gradient(to right,#4f46e5,#2563eb)",

                    color: "#fff",

                    padding: "20px",

                    borderRadius: "22px",

                    fontSize: "18px",

                    fontWeight: "800",

                    cursor:
                      starting
                        ? "not-allowed"
                        : "pointer",

                    transition: "0.3s",

                    boxShadow:
                      "0 10px 35px rgba(37,99,235,0.35)",
                  }}
                >

                  {starting
                    ? "Creating Cyber Lab..."
                    : "Start Cyber Security Exam"}

                </button>

)}

          </div>

        </div>

      </div>

    </div>
  );
};

export default CyberLabRules;