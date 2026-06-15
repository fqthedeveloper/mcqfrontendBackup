import React, { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Swal from "sweetalert2";

import { startCyberLab } from "../../../services/cyberApi";

const CyberLabStarting = () => {

  const { taskId } = useParams();

  const navigate = useNavigate();

  const [statusText, setStatusText] = useState(
    "Initializing Cyber Range..."
  );

  const [progress, setProgress] = useState(10);

  useEffect(() => {

    simulateProgress();

    startLab();

  }, []);

  const simulateProgress = () => {

    let current = 10;

    const messages = [

      "Initializing Cyber Range...",

      "Creating Attacker Machine...",

      "Creating Victim Machine...",

      "Configuring Isolated Network...",

      "Installing Security Tools...",

      "Applying Verification Scripts...",

      "Starting Guacamole Sessions...",

      "Finalizing Virtual Environment...",
    ];

    let index = 0;

    const interval = setInterval(() => {

      current += 10;

      if (current <= 90) {
        setProgress(current);
      }

      if (index < messages.length) {

        setStatusText(messages[index]);

        index++;
      }

    }, 1800);

    return () => clearInterval(interval);
  };

  const startLab = async () => {

    try {

      const data = await startCyberLab(taskId);

      setProgress(100);

      setStatusText(
        "Cyber Environment Ready"
      );

      Swal.fire({
        icon: "success",
        title: "Cyber Lab Ready",
        text:
          "Attacker and victim environments created successfully",
        timer: 2200,
        showConfirmButton: false,
        background: "#0f172a",
        color: "#fff",
      });

      setTimeout(() => {

        navigate(
          `/student/cyber/session/${data.id}`
        );

      }, 2000);

    } catch (err) {

      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Lab Start Failed",
        text:
          err?.error ||
          err?.detail ||
          "Unable to create isolated cyber environment",
        background: "#0f172a",
        color: "#fff",
      });

      navigate("/student/cyber");
    }
  };

  return (

    <div
      style={{
        minHeight: "100vh",

        background:
          "linear-gradient(to bottom right,#020617,#0f172a,#111827)",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        padding: "20px",
      }}
    >

      <div
        style={{

          width: "100%",

          maxWidth: "850px",

          background:
            "linear-gradient(145deg,#111827,#1e293b)",

          border:
            "1px solid rgba(255,255,255,0.08)",

          borderRadius: "32px",

          padding:
            window.innerWidth < 768
              ? "35px 25px"
              : "60px 50px",

          boxShadow:
            "0 20px 60px rgba(0,0,0,0.55)",

          position: "relative",

          overflow: "hidden",
        }}
      >

        {/* TOP GLOW */}

        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "240px",
            height: "240px",
            background:
              "rgba(37,99,235,0.25)",
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />

        {/* ICON */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "35px",
          }}
        >

          <div
            style={{
              fontSize:
                window.innerWidth < 768
                  ? "70px"
                  : "95px",

              marginBottom: "20px",
            }}
          >
            🛡️
          </div>

          <h1
            style={{
              color: "#fff",
              fontWeight: "900",
              fontSize:
                window.innerWidth < 768
                  ? "32px"
                  : "52px",

              marginBottom: "15px",

              lineHeight: "1.2",
            }}
          >
            Preparing Cyber Lab
          </h1>

          <p
            style={{
              color: "#94a3b8",
              fontSize:
                window.innerWidth < 768
                  ? "15px"
                  : "18px",

              lineHeight: "1.8",

              maxWidth: "650px",

              margin: "0 auto",
            }}
          >
            Creating isolated attacker and victim
            virtual machines with secure network
            topology and automated verification
            systems.
          </p>

        </div>

        {/* STATUS CARD */}

        <div
          style={{

            background:
              "rgba(255,255,255,0.04)",

            border:
              "1px solid rgba(255,255,255,0.06)",

            borderRadius: "24px",

            padding:
              window.innerWidth < 768
                ? "25px"
                : "35px",

            marginBottom: "35px",
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginBottom: "18px",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >

            <div
              style={{
                color: "#fff",
                fontWeight: "700",
                fontSize:
                  window.innerWidth < 768
                    ? "16px"
                    : "20px",
              }}
            >
              {statusText}
            </div>

            <div
              style={{
                color: "#3b82f6",
                fontWeight: "800",
                fontSize:
                  window.innerWidth < 768
                    ? "18px"
                    : "24px",
              }}
            >
              {progress}%
            </div>

          </div>

          {/* PROGRESS BAR */}

          <div
            style={{
              width: "100%",
              height: "18px",
              background:
                "rgba(255,255,255,0.08)",
              borderRadius: "999px",
              overflow: "hidden",
            }}
          >

            <div
              style={{

                width: `${progress}%`,

                height: "100%",

                background:
                  "linear-gradient(to right,#7c3aed,#2563eb)",

                borderRadius: "999px",

                transition:
                  "width 0.5s ease",
              }}
            />

          </div>

        </div>

        {/* FEATURES */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "18px",
          }}
        >

          {[
            {
              icon: "💻",
              title: "Attacker VM",
            },

            {
              icon: "🖥️",
              title: "Victim VM",
            },

            {
              icon: "🌐",
              title: "Isolated Network",
            },

            {
              icon: "📡",
              title: "Live Monitoring",
            },
          ].map((item, index) => (

            <div
              key={index}
              style={{

                background:
                  "rgba(255,255,255,0.04)",

                border:
                  "1px solid rgba(255,255,255,0.06)",

                borderRadius: "20px",

                padding: "22px",

                textAlign: "center",
              }}
            >

              <div
                style={{
                  fontSize: "38px",
                  marginBottom: "14px",
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "16px",
                }}
              >
                {item.title}
              </div>

            </div>

          ))}

        </div>

      </div>

    </div>

  );
};

export default CyberLabStarting;