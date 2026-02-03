import React, { useEffect, useState } from "react";
import { authGet, authPut } from "../../../services/api";

export default function AdminStudentList() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    is_verified: false,
    is_active: true,
    subject_ids: [],
  });

  useEffect(() => {
    loadStudents();
    loadSubjects();
    document.title = "Student List - Admin";
  }, []);

  const loadStudents = async () => {
    const res = await authGet("/mcq/students/");
    setStudents(Array.isArray(res) ? res : res.results || []);
  };

  const loadSubjects = async () => {
    const res = await authGet("/mcq/subjects/");
    setSubjects(Array.isArray(res) ? res : res.results || []);
  };

  const startEdit = (s) => {
    setEditId(s.id);
    setForm({
      first_name: s.first_name || "",
      last_name: s.last_name || "",
      is_verified: s.is_verified || false,
      is_active: s.is_active ?? true,
      subject_ids: s.subjects ? s.subjects.map((x) => x.id) : [],
    });
  };

  const save = async () => {
    await authPut(`/mcq/students/${editId}/`, form);
    setEditId(null);
    loadStudents();
  };

  return (
    <div className="page">
      <h2>Student List</h2>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subjects</th>
              <th>Verified</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) =>
              editId === s.id ? (
                <tr key={s.id}>
                  <td>
                    <input
                      value={[form.first_name, form.last_name]
                        .filter(Boolean)
                        .join(" ")}
                      onChange={(e) => {
                        const value = e.target.value.trimStart();
                        const parts = value.split(/\s+/);

                        setForm({
                          ...form,
                          first_name: parts[0] || "",
                          last_name: parts.slice(1).join(" "),
                        });
                      }}
                    />
                  </td>

                  <td>{s.email}</td>

                  <td>
                    <select
                      multiple
                      value={form.subject_ids}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          subject_ids: Array.from(
                            e.target.selectedOptions
                          ).map((o) => Number(o.value)),
                        })
                      }
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={form.is_verified}
                      onChange={(e) =>
                        setForm({ ...form, is_verified: e.target.checked })
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) =>
                        setForm({ ...form, is_active: e.target.checked })
                      }
                    />
                  </td>

                  <td>
                    <button onClick={save}>Save</button>
                    <button onClick={() => setEditId(null)}>Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.id}>
                  <td>
                    {[s.first_name, s.last_name].filter(Boolean).join(" ")}
                  </td>
                  <td>{s.email}</td>
                  <td>
                    {s.subjects?.length
                      ? s.subjects.map((x) => x.name).join(", ")
                      : "None"}
                  </td>
                  <td>{s.is_verified ? "Yes" : "No"}</td>
                  <td>{s.is_active ? "Yes" : "No"}</td>
                  <td>
                    <button onClick={() => startEdit(s)}>Edit</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .page { padding: 24px; }
        .table-wrap {
          overflow-x: auto;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,.08);
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 750px;
        }
        th, td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }
        th { background: #f4f6fb; }
        input, select { width: 100%; }
        button {
          margin-right: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          background: #2575fc;
          color: #fff;
          cursor: pointer;
        }
        button:last-child { background: #999; }
      `}</style>
    </div>
  );
}
