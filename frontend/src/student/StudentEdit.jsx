import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import Tooltip from "../utils/Tooltip";

function StudentEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const url = `/api/students/${id}/details/`;
        const resp = await authFetch(url);
        if (!resp.ok) throw new Error("Failed to fetch student");
        const data = await resp.json();
        const studentObj = data.student || data;
        setStudent(studentObj);
        console.log('Fetched student for edit:', studentObj);
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setStudent(s => ({
      ...s,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const url = `/api/students/${id}/`;
      const resp = await authFetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
      });
      if (!resp.ok) throw new Error("Failed to save student");
      navigate(`/students/${id}`);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="container mt-4">Loading...</div>;
  if (error) return <div className="container mt-4"><div className="alert alert-danger">{error}</div></div>;
  if (!student) return <div className="container mt-4">Student not found.</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Edit Student</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSave}>
            <div className="mb-3">
              <label className="form-label">First Name</label>
              <input type="text" className="form-control" name="first_name" value={student.first_name || ""} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-control" name="last_name" value={student.last_name || ""} onChange={handleChange} required />
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" name="active" id="active" checked={!!student.active} onChange={handleChange} />
              <label className="form-check-label" htmlFor="active">Active</label>
            </div>
            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" name="rochester" id="rochester" checked={!!student.rochester} onChange={handleChange} />
              <label className="form-check-label" htmlFor="rochester">Rochester Resident</label>
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={student.email || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" name="phone" value={student.phone || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Facebook Profile</label>
              <input type="url" className="form-control" name="facebook_profile" value={student.facebook_profile || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Emergency Contact Name</label>
              <input type="text" className="form-control" name="emergency_contact_name" value={student.emergency_contact_name || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Emergency Contact Phone</label>
              <input type="text" className="form-control" name="emergency_contact_phone" value={student.emergency_contact_phone || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Notes</label>
              <textarea className="form-control" name="notes" value={student.notes || ""} onChange={handleChange} rows={3} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>Save Changes</button>
            <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)} disabled={saving}>Cancel</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentEdit;
