import React from "react";

const GUACAMOLE_BASE_URL =
  "http://127.0.0.1:8080";

const CyberGuacamoleFrame = ({
  machine,
}) => {
  if (!machine) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
          background: "#fff3cd",
          borderRadius: "12px",
        }}
      >
        Select a Machine
      </div>
    );
  }

  const iframeUrl =
    machine.guacamole_url?.startsWith("http")
      ? machine.guacamole_url
      : `${GUACAMOLE_BASE_URL}${machine.guacamole_url}`;

  return (
    <div
      style={{
        borderRadius: "15px",
        overflow: "hidden",
        background: "#fff",
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          background: "#212529",
          color: "#fff",
          padding: "15px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "15px",
            justifyContent:
              "space-between",
          }}
        >
          <div>
            <strong>Role:</strong>{" "}
            {machine.role}
          </div>

          <div>
            <strong>VM:</strong>{" "}
            {machine.vm_name}
          </div>

          <div>
            <strong>IP:</strong>{" "}
            {machine.vm_ip}
          </div>

          <div>
            <strong>Status:</strong>{" "}
            <span
              style={{
                color:
                  machine.status ===
                  "running"
                    ? "#00ff7f"
                    : "#ff4d4d",
              }}
            >
              {machine.status}
            </span>
          </div>
        </div>
      </div>

      <iframe
        title={machine.vm_name}
        src={iframeUrl}
        allowFullScreen
        frameBorder="0"
        style={{
          width: "100%",
          height: "75vh",
          border: "none",
          background: "#000",
        }}
      />
    </div>
  );
};

export default CyberGuacamoleFrame;