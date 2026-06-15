import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import Swal from "sweetalert2";

import api from "../../../services/api";

const CyberPracticalTaskEdit = () => {

  const navigate = useNavigate();

  const { id } = useParams();

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
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

      variable_schema: "{}",

      attacker_init_template: "",

      victim_init_template: "",

      monitor_init_template: "",

      verify_template: "",

      is_published: true,

      is_active: true,
    });

  useEffect(() => {

    loadSubjects();

    loadTopologies();

    loadTask();

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

      setSubjects([]);
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

      setTopologies([]);
    }
  };

  const loadTask = async () => {

    try {

      const res = await api.get(
        `/cyber/admin/tasks/${id}/`
      );

      setFormData({

        ...res,

        subject:
          res.subject?.id ||
          res.subject,

        topology:
          res.topology?.id ||
          res.topology,

        variable_schema:
          JSON.stringify(
            res.variable_schema || {},
            null,
            2
          ),
      });

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Load Failed",

        text:
          "Unable to load practical details.",
      });

    } finally {

      setLoading(false);
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

      setSaving(true);

      const payload = {

        ...formData,

        variable_schema:
          JSON.parse(
            formData.variable_schema
          ),
      };

      await api.put(
        `/cyber/admin/tasks/${id}/`,
        payload
      );

      Swal.fire({

        icon: "success",

        title: "Updated",

        text:
          "Cyber Practical Updated Successfully",

        timer: 2000,

        showConfirmButton: false,
      });

      setTimeout(() => {

        navigate(
          "/admin/cyber-practical-list"
        );

      }, 2000);

    } catch (err) {

      console.error(err);

      Swal.fire({

        icon: "error",

        title: "Update Failed",

        text:
          err?.detail ||
          "Something went wrong",
      });

    } finally {

      setSaving(false);
    }
  };

  if (loading) {

    return (

      <div style={{

        minHeight: "100vh",

        display: "flex",

        justifyContent: "center",

        alignItems: "center",

        background: "#0f172a",

        color: "white",

        fontSize: "22px",
      }}>

        Loading...

      </div>
    );
  }

  return (

    <>
      {/* ===================================================== */}
      {/* INTERNAL RESPONSIVE CSS */}
      {/* ===================================================== */}

      <style>{`

        .cyber-edit-page {

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

        .cyber-edit-container {

          max-width: 1500px;

          margin: auto;
        }

        .cyber-edit-card {

          background:
            rgba(15,23,42,0.96);

          border-radius: 28px;

          overflow: hidden;

          border:
            1px solid rgba(255,255,255,0.06);

          box-shadow:
            0 20px 60px rgba(0,0,0,0.5);
        }

        .cyber-edit-header {

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

        .cyber-edit-header h1 {

          color: white;

          font-size: 40px;

          margin: 0;

          font-weight: 800;
        }

        .cyber-edit-header p {

          color: #94a3b8;

          margin-top: 10px;

          font-size: 15px;
        }

        .cyber-edit-body {

          padding: 35px;
        }

        .cyber-grid {

          display: grid;

          grid-template-columns:
            repeat(auto-fit, minmax(350px,1fr));

          gap: 25px;
        }

        .cyber-full {

          grid-column: 1 / -1;
        }

        .cyber-group {

          display: flex;

          flex-direction: column;
        }

        .cyber-group label {

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

        .cyber-section {

          margin-top: 50px;
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

        .cyber-checkbox-row {

          display: flex;

          align-items: center;

          gap: 12px;

          margin-bottom: 15px;
        }

        .cyber-checkbox {

          width: 18px;

          height: 18px;
        }

        .cyber-submit-area {

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

        @media (max-width: 1200px) {

          .cyber-grid {

            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {

          .cyber-edit-header {

            padding: 25px;
          }

          .cyber-edit-header h1 {

            font-size: 28px;
          }

          .cyber-edit-body {

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

          .cyber-edit-page {

            padding: 10px;
          }

          .cyber-input,
          .cyber-select,
          .cyber-textarea {

            padding: 12px;

            font-size: 14px;
          }

          .cyber-edit-header h1 {

            font-size: 24px;
          }
        }

      `}</style>

      {/* ===================================================== */}
      {/* PAGE */}
      {/* ===================================================== */}

      <div className="cyber-edit-page">

        <div className="cyber-edit-container">

          <div className="cyber-edit-card">

            {/* HEADER */}

            <div className="cyber-edit-header">

              <h1>
                Edit Cybersecurity Practical
              </h1>

              <p>
                Update topology, scripts,
                scoring, and GUI lab
                configuration.
              </p>

            </div>

            {/* BODY */}

            <div className="cyber-edit-body">

              <form onSubmit={handleSubmit}>

                {/* ===================================================== */}
                {/* BASIC */}
                {/* ===================================================== */}

                <div className="cyber-section-title">
                  Basic Information
                </div>

                <div className="cyber-grid">

                  <div className="cyber-group">

                    <label>
                      Title
                    </label>

                    <input
                      type="text"
                      name="title"
                      className="cyber-input"
                      value={formData.title}
                      onChange={handleChange}
                    />

                  </div>

                  <div className="cyber-group">

                    <label>
                      Subject
                    </label>

                    <select
                      name="subject"
                      className="cyber-select"
                      value={formData.subject}
                      onChange={handleChange}
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

                  <div className="cyber-group">

                    <label>
                      Topology
                    </label>

                    <select
                      name="topology"
                      className="cyber-select"
                      value={formData.topology}
                      onChange={handleChange}
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

                  <div className="cyber-group">

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

                  <div className="cyber-group">

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

                  <div className="cyber-group">

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
                    cyber-group
                    cyber-full
                  ">

                    <label>
                      Description
                    </label>

                    <textarea
                      name="description"
                      className="cyber-textarea"
                      value={
                        formData.description
                      }
                      onChange={handleChange}
                    />

                  </div>

                </div>

                {/* ===================================================== */}
                {/* VARIABLES */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Dynamic Variables
                  </div>

                  <div className="cyber-script-box">

                    <div className="cyber-group">

                      <label>
                        Variable Schema JSON
                      </label>

                      <textarea
                        rows="10"
                        name="variable_schema"
                        className="cyber-textarea"
                        value={
                          formData.variable_schema
                        }
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                </div>

                {/* ===================================================== */}
                {/* ATTACKER */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Attacker Machine
                  </div>

                  <div className="cyber-script-box">

                    <div className="cyber-group">

                      <label>
                        Attacker Init Template
                      </label>

                      <textarea
                        rows="12"
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

                </div>

                {/* ===================================================== */}
                {/* VICTIM */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Victim Machine
                  </div>

                  <div className="cyber-script-box">

                    <div className="cyber-group">

                      <label>
                        Victim Init Template
                      </label>

                      <textarea
                        rows="12"
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

                </div>

                {/* ===================================================== */}
                {/* MONITOR */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Monitor Machine
                  </div>

                  <div className="cyber-script-box">

                    <div className="cyber-group">

                      <label>
                        Monitor Init Template
                      </label>

                      <textarea
                        rows="10"
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

                </div>

                {/* ===================================================== */}
                {/* VERIFY */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Verification Engine
                  </div>

                  <div className="cyber-script-box">

                    <div className="cyber-group">

                      <label>
                        Verification Template
                      </label>

                      <textarea
                        rows="12"
                        name="verify_template"
                        className="cyber-textarea"
                        value={
                          formData.verify_template
                        }
                        onChange={handleChange}
                      />

                    </div>

                  </div>

                </div>

                {/* ===================================================== */}
                {/* FLAGS */}
                {/* ===================================================== */}

                <div className="cyber-section">

                  <div className="cyber-section-title">
                    Publishing
                  </div>

                  <div className="cyber-checkbox-row">

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

                  <div className="cyber-checkbox-row">

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

                </div>

                {/* ===================================================== */}
                {/* SAVE */}
                {/* ===================================================== */}

                <div className="cyber-submit-area">

                  <button
                    type="submit"
                    className="cyber-submit-btn"
                    disabled={saving}
                  >

                    {
                      saving
                        ? "Updating..."
                        : "Update Cyber Practical"
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

export default CyberPracticalTaskEdit;