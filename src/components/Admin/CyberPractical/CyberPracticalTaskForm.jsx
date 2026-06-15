import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import Swal from "sweetalert2";

import api from "../../../services/api";

const CyberPracticalTaskForm = () => {

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(false);

  const [subjects, setSubjects] =
    useState([]);

  const [topologies, setTopologies] =
    useState([]);

  const [formData, setFormData] =
    useState({

      title: "",

      description: "",

      subject: "",

      topology: "",

      difficulty: "easy",

      duration_minutes: 60,

      total_marks: 100,

      variable_schema: `{
  "attacker_ip": "random_ip",
  "victim_user": "random_username",
  "service_port": "random_port"
}`,

      attacker_init_template: `#!/bin/bash

echo "Preparing attacker machine"

`,

      victim_init_template: `#!/bin/bash

echo "Preparing victim machine"

`,

      monitor_init_template: `#!/bin/bash

echo "Preparing monitor machine"

`,

      verify_template: `#!/bin/bash

echo "Verification started"

`,

      is_published: true,

      is_active: true,
    });

  useEffect(() => {

    loadSubjects();

    loadTopologies();

  }, []);

  const loadSubjects = async () => {

    try {

      const res = await api.get(
        "/mcq/subjects/"
      );

      setSubjects(
        Array.isArray(res)
          ? res
          : res.results || []
      );

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Subject Load Failed",

        text:
          "Unable to load subjects",
      });
    }
  };

  const loadTopologies = async () => {

    try {

      const res = await api.get(
        "/cyber/admin/topologies/"
      );

      setTopologies(
        Array.isArray(res)
          ? res
          : res.results || []
      );

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Topology Load Failed",

        text:
          "Unable to load topologies",
      });
    }
  };

  const handleChange = (e) => {

    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({

      ...prev,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      Swal.fire({

        title: "Creating Practical",

        text:
          "Please wait...",

        allowOutsideClick: false,

        didOpen: () => {

          Swal.showLoading();
        },
      });

      const payload = {

        ...formData,

        variable_schema:
          JSON.parse(
            formData.variable_schema
          ),
      };

      await api.post(
        "/cyber/admin/tasks/",
        payload
      );

      Swal.fire({

        icon: "success",

        title: "Created Successfully",

        text:
          "Cyber Practical Created",

        timer: 2200,

        showConfirmButton: false,
      });

      setTimeout(() => {

        navigate(
          "/admin/cyber-practical-list"
        );

      }, 2200);

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Creation Failed",

        text:
          err?.detail ||
          "Something went wrong",
      });

    } finally {

      setLoading(false);
    }
  };

  return (

    <>
      {/* ===================================================== */}
      {/* RESPONSIVE CSS */}
      {/* ===================================================== */}

      <style>{`

        .cyber-admin-page {

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

        .cyber-admin-wrapper {

          max-width: 1600px;

          margin: auto;
        }

        .cyber-form-card {

          background:
            rgba(15,23,42,0.96);

          border-radius: 28px;

          overflow: hidden;

          border:
            1px solid rgba(255,255,255,0.06);

          box-shadow:
            0 20px 60px rgba(0,0,0,0.45);
        }

        .cyber-form-header {

          padding: 40px;

          background:
            linear-gradient(
              135deg,
              #1e293b,
              #0f172a
            );

          border-bottom:
            1px solid rgba(255,255,255,0.08);
        }

        .cyber-form-header h1 {

          color: white;

          margin: 0;

          font-size: 40px;

          font-weight: 800;
        }

        .cyber-form-header p {

          color: #94a3b8;

          margin-top: 10px;

          font-size: 15px;
        }

        .cyber-form-body {

          padding: 35px;
        }

        .cyber-grid {

          display: grid;

          grid-template-columns:
            repeat(auto-fit,minmax(350px,1fr));

          gap: 25px;
        }

        .cyber-full {

          grid-column: 1 / -1;
        }

        .cyber-form-group {

          display: flex;

          flex-direction: column;
        }

        .cyber-form-group label {

          color: #cbd5e1;

          margin-bottom: 10px;

          font-size: 14px;

          font-weight: 600;
        }

        .cyber-input,
        .cyber-select,
        .cyber-textarea {

          width: 100%;

          background: #020617;

          border:
            1px solid rgba(255,255,255,0.08);

          border-radius: 14px;

          padding: 15px;

          color: white;

          font-size: 15px;

          transition: 0.3s;
        }

        .cyber-input:focus,
        .cyber-select:focus,
        .cyber-textarea:focus {

          outline: none;

          border-color: #3b82f6;

          box-shadow:
            0 0 0 4px rgba(59,130,246,0.15);
        }

        .cyber-textarea {

          min-height: 220px;

          resize: vertical;

          font-family: monospace;
        }

        .cyber-section-title {

          color: white;

          font-size: 22px;

          font-weight: 700;

          margin-bottom: 20px;

          border-bottom:
            1px solid rgba(255,255,255,0.08);

          padding-bottom: 10px;
        }

        .cyber-script-box {

          background: #020617;

          border-radius: 18px;

          padding: 20px;

          border:
            1px solid rgba(255,255,255,0.05);
        }

        .cyber-checkbox-wrapper {

          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 15px;
        }

        .cyber-checkbox {

          width: 18px;

          height: 18px;
        }

        .cyber-submit-wrapper {

          margin-top: 50px;

          display: flex;

          justify-content: flex-end;
        }

        .cyber-submit-btn {

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #1d4ed8
            );

          border: none;

          color: white;

          padding: 16px 40px;

          border-radius: 14px;

          font-size: 16px;

          font-weight: 700;

          cursor: pointer;

          transition: 0.3s;

          min-width: 250px;
        }

        .cyber-submit-btn:hover {

          transform: translateY(-2px);

          box-shadow:
            0 12px 25px rgba(37,99,235,0.3);
        }

        .cyber-submit-btn:disabled {

          opacity: 0.6;

          cursor: not-allowed;
        }

        .cyber-json-tip {

          color: #94a3b8;

          font-size: 13px;

          margin-top: 8px;
        }

        @media (max-width: 1200px) {

          .cyber-grid {

            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {

          .cyber-admin-page {

            padding: 10px;
          }

          .cyber-form-header {

            padding: 25px;
          }

          .cyber-form-header h1 {

            font-size: 28px;
          }

          .cyber-form-body {

            padding: 20px;
          }

          .cyber-submit-btn {

            width: 100%;
          }

          .cyber-textarea {

            min-height: 180px;
          }
        }

        @media (max-width: 480px) {

          .cyber-input,
          .cyber-select,
          .cyber-textarea {

            font-size: 14px;

            padding: 12px;
          }

          .cyber-form-header h1 {

            font-size: 24px;
          }
        }

      `}</style>

      {/* ===================================================== */}
      {/* PAGE */}
      {/* ===================================================== */}

      <div className="cyber-admin-page">

        <div className="cyber-admin-wrapper">

          <div className="cyber-form-card">

            {/* HEADER */}

            <div className="cyber-form-header">

              <h1>
                Create Cybersecurity Practical
              </h1>

              <p>
                Configure attacker/victim topology,
                dynamic variables,
                verification scripts,
                and GUI lab environments.
              </p>

            </div>

            {/* BODY */}

            <div className="cyber-form-body">

              <form onSubmit={handleSubmit}>

                {/* BASIC */}

                <div className="cyber-section-title">
                  Basic Information
                </div>

                <div className="cyber-grid">

                  <div className="cyber-form-group">

                    <label>
                      Practical Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      className="cyber-input"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />

                  </div>

                  <div className="cyber-form-group">

                    <label>
                      Subject
                    </label>

                    <select
                      name="subject"
                      className="cyber-select"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select Subject
                      </option>

                      {subjects.map((sub) => (

                        <option
                          key={sub.id}
                          value={sub.id}
                        >
                          {sub.name}
                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="cyber-form-group">

                    <label>
                      Topology
                    </label>

                    <select
                      name="topology"
                      className="cyber-select"
                      value={formData.topology}
                      onChange={handleChange}
                      required
                    >

                      <option value="">
                        Select Topology
                      </option>

                      {topologies.map((topo) => (

                        <option
                          key={topo.id}
                          value={topo.id}
                        >
                          {topo.name}
                        </option>

                      ))}

                    </select>

                  </div>

                  <div className="cyber-form-group">

                    <label>
                      Difficulty
                    </label>

                    <select
                      name="difficulty"
                      className="cyber-select"
                      value={formData.difficulty}
                      onChange={handleChange}
                    >

                      <option value="easy">
                        Easy
                      </option>

                      <option value="medium">
                        Medium
                      </option>

                      <option value="hard">
                        Hard
                      </option>

                    </select>

                  </div>

                  <div className="cyber-form-group">

                    <label>
                      Duration (Minutes)
                    </label>

                    <input
                      type="number"
                      name="duration_minutes"
                      className="cyber-input"
                      value={
                        formData.duration_minutes
                      }
                      onChange={handleChange}
                    />

                  </div>

                  <div className="cyber-form-group">

                    <label>
                      Total Marks
                    </label>

                    <input
                      type="number"
                      name="total_marks"
                      className="cyber-input"
                      value={
                        formData.total_marks
                      }
                      onChange={handleChange}
                    />

                  </div>

                  <div className="
                    cyber-form-group
                    cyber-full
                  ">

                    <label>
                      Challenge Description
                    </label>

                    <textarea
                      name="description"
                      className="cyber-textarea"
                      value={
                        formData.description
                      }
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>

                {/* VARIABLES */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Dynamic Variables
                </div>

                <div className="cyber-form-group">

                  <label>
                    Variable Schema JSON
                  </label>

                  <textarea
                    name="variable_schema"
                    className="cyber-textarea"
                    value={
                      formData.variable_schema
                    }
                    onChange={handleChange}
                  />

                  <div className="cyber-json-tip">

                    Example:
                    attacker_ip,
                    random_username,
                    random_port

                  </div>

                </div>

                {/* ATTACKER */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Attacker Machine
                </div>

                <div className="cyber-script-box">

                  <div className="cyber-form-group">

                    <label>
                      Attacker Init Template
                    </label>

                    <textarea
                      name="
                      attacker_init_template"
                      className="cyber-textarea"
                      value={
                        formData.attacker_init_template
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                {/* VICTIM */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Victim Machine
                </div>

                <div className="cyber-script-box">

                  <div className="cyber-form-group">

                    <label>
                      Victim Init Template
                    </label>

                    <textarea
                      name="
                      victim_init_template"
                      className="cyber-textarea"
                      value={
                        formData.victim_init_template
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                {/* MONITOR */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Monitor Machine
                </div>

                <div className="cyber-script-box">

                  <div className="cyber-form-group">

                    <label>
                      Monitor Init Template
                    </label>

                    <textarea
                      name="
                      monitor_init_template"
                      className="cyber-textarea"
                      value={
                        formData.monitor_init_template
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                {/* VERIFY */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Verification Engine
                </div>

                <div className="cyber-script-box">

                  <div className="cyber-form-group">

                    <label>
                      Verification Template
                    </label>

                    <textarea
                      name="verify_template"
                      className="cyber-textarea"
                      value={
                        formData.verify_template
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                {/* OPTIONS */}

                <div className="
                  cyber-section-title mt-5
                ">
                  Publishing
                </div>

                <div className="
                  cyber-checkbox-wrapper
                ">

                  <input
                    type="checkbox"
                    name="is_published"
                    className="cyber-checkbox"
                    checked={
                      formData.is_published
                    }
                    onChange={handleChange}
                  />

                  <label>
                    Published
                  </label>

                </div>

                <div className="
                  cyber-checkbox-wrapper
                ">

                  <input
                    type="checkbox"
                    name="is_active"
                    className="cyber-checkbox"
                    checked={
                      formData.is_active
                    }
                    onChange={handleChange}
                  />

                  <label>
                    Active
                  </label>

                </div>

                {/* SUBMIT */}

                <div className="
                  cyber-submit-wrapper
                ">

                  <button
                    type="submit"
                    className="cyber-submit-btn"
                    disabled={loading}
                  >

                    {
                      loading
                        ? "Creating..."
                        : "Create Cyber Practical"
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      </div>

    </>
  );
};

export default CyberPracticalTaskForm;