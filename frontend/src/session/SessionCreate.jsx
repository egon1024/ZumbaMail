import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function SessionCreate() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    organization: "",
    start_date: null,
    end_date: null,
    closed: false,
    copyFromSession: ""
  });
  const [sessions, setSessions] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch previous sessions for copy option
    (async () => {
      try {
        const resp = await authFetch("/api/sessions/");
        if (resp.ok) {
          const data = await resp.json();
          setSessions(Array.isArray(data) ? data : data.sessions || []);
        }
      } catch {}
    })();
    // Fetch organizations for dropdown
    (async () => {
      try {
        const resp = await authFetch("/api/organizations/");
        if (resp.ok) {
          const data = await resp.json();
          setOrganizations(Array.isArray(data) ? data : data.organizations || []);
        }
      } catch {}
    })();
  }, []);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }
  function handleDateChange(name, date) {
    setForm(f => ({ ...f, [name]: date }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    // Client-side validation: end date after start date
    if (form.start_date && form.end_date && form.end_date <= form.start_date) {
      setError("End date must be after start date.");
      setSaving(false);
      return;
    }
    try {
      // Create session
      const resp = await authFetch("/api/sessions/new/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          start_date: form.start_date ? form.start_date.toISOString().slice(0, 10) : "",
          end_date: form.end_date ? form.end_date.toISOString().slice(0, 10) : "",
          closed: form.closed,
          organization: form.organization
        })
      });
      if (!resp.ok) throw new Error("Failed to create session");
      const newSession = await resp.json();
      // Copy activities if selected
      if (form.copyFromSession) {
        await authFetch(`/api/sessions/${newSession.id}/copy_activities/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from_session_id: form.copyFromSession })
        });
      }
      navigate(`/sessions/${newSession.id}`);
    } catch (err) {
      setError("Failed to create session. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Create New Session</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="form-control" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Organization</label>
              <select
                name="organization"
                value={form.organization}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="" disabled>Select organization...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Start Date</label>
              <DatePicker
                selected={form.start_date}
                onChange={date => handleDateChange("start_date", date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">End Date</label>
              <DatePicker
                selected={form.end_date}
                onChange={date => handleDateChange("end_date", date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
                required
                popperPlacement="bottom"
                popperModifiers={[{ name: 'flip', enabled: false }, { name: 'preventOverflow', enabled: true, options: { altAxis: true, tether: false } }]}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <div className="form-check form-switch">
                <input
                  className={`form-check-input ${form.closed ? 'bg-danger border-danger' : 'bg-success border-success'}`}
                  type="checkbox"
                  id="closedSwitch"
                  name="closed"
                  checked={!form.closed}
                  onChange={e => setForm(f => ({ ...f, closed: !e.target.checked }))}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label ms-2" htmlFor="closedSwitch" style={{ color: form.closed ? '#dc3545' : '#198754', fontWeight: 'bold' }}>
                  {form.closed ? 'Closed' : 'Open'}
                </label>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Copy Classes from Previous Session</label>
              <select name="copyFromSession" value={form.copyFromSession} onChange={handleChange} className="form-select">
                <option value="">None</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.start_date} - {s.end_date})
                    {typeof s.activity_count === 'number' ? ` — ${s.activity_count} class${s.activity_count === 1 ? '' : 'es'}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Creating...' : 'Create Session'}
              </button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>
            </div>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}

export default SessionCreate;
