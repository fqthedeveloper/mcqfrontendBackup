import React, { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  getCyberSession,
  submitCyberSession,
} from "../../../services/cyberApi";

import CyberMachineTabs from "./CyberMachineTabs";
import CyberGuacamoleFrame from "./CyberGuacamoleFrame";
import CyberTimer from "./CyberTimer";

const CyberLabExam = () => {

  const { sessionId } = useParams();

  const navigate = useNavigate();

  const [session, setSession] = useState(null);

  const [overview, setOverview] = useState(null);

  const [machines, setMachines] = useState([]);

  const [activeMachine, setActiveMachine] =
    useState(null);

  const [remaining, setRemaining] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    loadSession();

    const interval = setInterval(() => {

      loadSession();

    }, 600000); // Refresh every 10 minutes

    return () => clearInterval(interval);

  }, []);

  const loadSession = async () => {

    try {

      const data =
        await getCyberSession(sessionId);

      console.log(
        "CYBER SESSION RESPONSE",
        data
      );

      if (!data) {
        return;
      }

      setSession(data.session || null);

      setOverview(data.overview || null);

      setRemaining(
        Number(data.remaining_time) || 0
      );

      const machineList =
        data.machines ||
        data.session?.machines ||
        [];

      setMachines(machineList);

      if (
        machineList.length > 0 &&
        !activeMachine
      ) {

        setActiveMachine(
          machineList[0]
        );

      }

    } catch (error) {

      console.error(
        "LOAD SESSION ERROR",
        error
      );

    } finally {

      setLoading(false);

    }

  };

  const handleSubmit = async () => {

    const confirmed =
      window.confirm(
        "Are you sure you want to submit this lab?"
      );

    if (!confirmed) {
      return;
    }

    try {

      const result =
        await submitCyberSession(
          sessionId
        );

      navigate(
        `/student/cyber/result/${sessionId}`,
        {
          state: result,
        }
      );

    } catch (error) {

      console.error(
        "SUBMIT ERROR",
        error
      );

      alert(
        "Failed to submit lab."
      );

    }

  };

  if (loading) {

    return (

      <div className="container mt-5 text-center">

        <div className="spinner-border text-primary" />

        <h5 className="mt-3">
          Preparing Cyber Lab...
        </h5>

      </div>

    );

  }

  if (!session) {

    return (

      <div className="container mt-5">

        <div className="alert alert-danger">

          Failed to load cyber lab session.

        </div>

      </div>

    );

  }

  return (

<div
  style={{
    padding: "15px",
    background: "#f4f6f9",
    minHeight: "100vh",
  }}
>

  {/* HEADER */}

  <div
    style={{
      background: "#ffffff",
      borderRadius: "15px",
      padding: "15px",
      marginBottom: "15px",
      boxShadow:
        "0 2px 10px rgba(0,0,0,0.08)",
    }}
  >

    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent:
          "space-between",
        gap: "15px",
      }}
    >

      {/* TITLE */}

      <div>

        <h3
          style={{
            margin: 0,
            fontWeight: "700",
          }}
        >
          {overview?.title ||
            "Cyber Lab"}
        </h3>

        <small
          style={{
            color: "#6c757d",
          }}
        >
          {overview?.topology}
        </small>

      </div>

      {/* MACHINE SWITCHER */}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          justifyContent: "center",
          flex: 1,
        }}
      >

        {machines.map((machine) => (

          <button
            key={machine.id}
            onClick={() =>
              setActiveMachine(machine)
            }
            style={{
              border: "none",
              padding:
                "10px 18px",
              borderRadius:
                "10px",
              fontWeight:
                "600",
              cursor: "pointer",
              transition:
                "0.3s ease",
              background:
                activeMachine?.id ===
                machine.id
                  ? "#0d6efd"
                  : "#e9ecef",
              color:
                activeMachine?.id ===
                machine.id
                  ? "#fff"
                  : "#212529",
            }}
          >
            {machine.role?.toUpperCase()}
          </button>

        ))}

      </div>

      {/* TIMER */}

      <div>

        <CyberTimer
          seconds={remaining}
        />

      </div>

    </div>

  </div>

  {/* MAIN CONTENT */}

  <div className="row g-3">

    {/* LEFT PANEL */}

    <div className="col-xl-4 col-lg-4 col-md-12">

      <div
        style={{
          background: "#ffffff",
          borderRadius: "15px",
          padding: "20px",
          height: "100%",
          boxShadow:
            "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >

        <h5
          style={{
            fontWeight: "700",
          }}
        >
          Lab Details
        </h5>

        <hr />

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <strong>
            Difficulty:
          </strong>{" "}
          {overview?.difficulty}
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <strong>
            Machines:
          </strong>{" "}
          {overview?.machine_count}
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <strong>
            Total Marks:
          </strong>{" "}
          {overview?.total_marks}
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <strong>
            Duration:
          </strong>{" "}
          {overview?.duration_minutes}
          {" "}Minutes
        </div>

        <div
          style={{
            marginBottom: "15px",
          }}
        >
          <strong>
            Session Status:
          </strong>

          <span
            style={{
              marginLeft: "10px",
              background:
                "#198754",
              color: "#fff",
              padding:
                "4px 10px",
              borderRadius:
                "20px",
              fontSize:
                "12px",
            }}
          >
            {session?.status}
          </span>

        </div>

        <hr />

        <h5
          style={{
            fontWeight: "700",
          }}
        >
          Lab Objectives
        </h5>

        <div
          dangerouslySetInnerHTML={{
            __html:
              overview?.description ||
              "<p>No instructions available</p>",
          }}
        />

        <hr />

        <h6
          style={{
            fontWeight: "700",
          }}
        >
          Available Machines
        </h6>

        {machines.map(
          (machine) => (

            <div
              key={machine.id}
              style={{
                border:
                  "1px solid #dee2e6",
                borderRadius:
                  "10px",
                padding:
                  "12px",
                marginBottom:
                  "10px",
              }}
            >

              <div>
                <strong>
                  {machine.role?.toUpperCase()}
                </strong>
              </div>

              <div>
                VM:
                {" "}
                {machine.vm_name}
              </div>

              <div>
                IP:
                {" "}
                {machine.vm_ip}
              </div>

              <div>
                User:
                {" "}
                {machine.username}
              </div>

              <div>
                Status:
                {" "}

                <span
                  style={{
                    color:
                      machine.status ===
                      "running"
                        ? "green"
                        : "red",
                    fontWeight:
                      "600",
                  }}
                >
                  {machine.status}
                </span>

              </div>

            </div>

          )
        )}

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            background:
              "#198754",
            color: "#fff",
            border: "none",
            padding: "14px",
            borderRadius:
              "10px",
            fontWeight:
              "700",
            marginTop:
              "15px",
          }}
        >
          Submit Lab
        </button>

      </div>

    </div>

    {/* RIGHT PANEL */}

    <div className="col-xl-8 col-lg-8 col-md-12">

      <CyberGuacamoleFrame
        machine={activeMachine}
      />

    </div>

  </div>

</div>

);

};

export default CyberLabExam;