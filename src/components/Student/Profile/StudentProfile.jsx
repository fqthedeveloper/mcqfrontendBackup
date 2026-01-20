import React, { useEffect, useState } from "react";
import { authGet, authPut, getUser, setUser } from "../../../services/api";
import "./StudentProfile.css";

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
  });

  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await authGet("/mcq/my-profile/");
      setProfile(data);
      setOriginalProfile(data);
    } catch (err) {
      console.error("Profile fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleEdit = () => {
    setEditMode(true);
    setMessage("");
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setEditMode(false);
    setMessage("");
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const updated = await authPut("/mcq/my-profile/", {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      });

      const storedUser = getUser();
      setUser({ ...storedUser, ...updated });

      setOriginalProfile(updated);
      setProfile(updated);
      setEditMode(false);
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    document.title = "My Profile";
  }, []);

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-title">
          <div className="profile-avatar">👤</div>
          <div>
            <h2>Profile</h2>
            <p>Account details</p>
          </div>
        </div>

        <div className="profile-card">
          <div className="profile-grid">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>

            <div className="form-group">
              <label>Username</label>
              <input type="text" value={profile.username} disabled />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                disabled={!editMode}
              />
            </div>
          </div>

          {message && <div className="profile-message">{message}</div>}

          <div className="profile-actions">
            {!editMode ? (
              <button className="btn edit-btn" onClick={handleEdit}>
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  className="btn save-btn"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button className="btn cancel-btn" onClick={handleCancel}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
