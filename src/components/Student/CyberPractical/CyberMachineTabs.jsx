import React from "react";

const CyberMachineTabs = ({
  machines = [],
  activeMachine,
  setActiveMachine,
}) => {
  if (!machines?.length) {
    return (
      <div
        style={{
          background: "#fff3cd",
          borderRadius: "12px",
          padding: "15px",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        No Machines Available
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "15px",
        padding: "15px",
        marginBottom: "20px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          overflowX: "auto",
          paddingBottom: "5px",
        }}
      >
        {machines.map((machine) => (
          <button
            key={machine.id}
            onClick={() => setActiveMachine(machine)}
            style={{
              minWidth: "180px",
              border: "none",
              borderRadius: "12px",
              padding: "12px",
              transition: "0.3s",
              cursor: "pointer",
              background:
                activeMachine?.id === machine.id
                  ? "#0d6efd"
                  : "#f8f9fa",
              color:
                activeMachine?.id === machine.id
                  ? "#fff"
                  : "#212529",
              fontWeight: "600",
            }}
          >
            <div>
              {machine.role?.toUpperCase()}
            </div>

            <small>
              {machine.vm_name}
            </small>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CyberMachineTabs;