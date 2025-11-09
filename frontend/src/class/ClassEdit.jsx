
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { formatTime, parseTime12hr } from "../utils/formatTime";
import DayOfWeek from "../utils/DayOfWeek";

function ClassEdit() {
  const location = useLocation();
  // Parse query params for org/session defaults
  const queryParams = new URLSearchParams(location.search);
  const orgDefault = queryParams.get('organization');
  const sessionDefault = queryParams.get('session');
  const [orgName, setOrgName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [orgError, setOrgError] = useState(null);
  const [sessionError, setSessionError] = useState(null);
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    async function fetchLocationOptions() {
      setLocationLoading(true);
      try {
        const resp = await authFetch('/api/activity/location_choices/');
        if (!resp.ok) throw new Error('Failed to fetch location options');
        const data = await resp.json();
        setLocationOptions(data.locations || []);
      } catch (err) {
        setLocationError(err.message);
      } finally {
        setLocationLoading(false);
      }
    }
    fetchLocationOptions();
  }, []);
  // Helper to format time from backend (HH:MM:SS or HH:MM) to 12-hour am/pm

  function handleTimeChange(e) {
    setForm(f => ({ ...f, time: e.target.value }));
  }

  function handleTimeBlur(e) {
    const value = e.target.value.trim();
    if (value) {
      try {
        // Try to parse and reformat the time
        const parsed24hr = parseTime12hr(value);
        const formatted12hr = formatTime(parsed24hr);
        setForm(f => ({ ...f, time: formatted12hr }));
      } catch (err) {
        // If parsing fails, leave the value as-is for the user to correct
      }
    }
  }
  // Add state for type choices
  const [typeChoices, setTypeChoices] = useState([]);
  const [typeChoicesLoading, setTypeChoicesLoading] = useState(true);
  const [typeChoicesError, setTypeChoicesError] = useState(null);

  useEffect(() => {
    async function fetchTypeChoices() {
      setTypeChoicesLoading(true);
      try {
        const resp = await authFetch('/api/activity/type_choices/');
        if (!resp.ok) throw new Error('Failed to fetch type choices');
        const data = await resp.json();
        setTypeChoices(data.choices || []);
      } catch (err) {
        setTypeChoicesError(err.message);
      } finally {
        setTypeChoicesLoading(false);
      }
    }
    fetchTypeChoices();
  }, []);
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: "",
    day_of_week: "Monday",
    time: "",
    location: "",
    closed: false,
    session: "", // Will be populated in edit mode
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Only treat id as edit mode if it's a valid number
    const isEditMode = id && !isNaN(Number(id));
    if (isEditMode) {
      async function fetchClass() {
        setLoading(true);
        try {
          const resp = await authFetch(`/api/activity/${id}/`);
          if (!resp.ok) throw new Error("Class not found");
          const data = await resp.json();
          setForm({
            type: data.type || "",
            day_of_week: data.day_of_week || "Monday",
            time: formatTime(data.time),
            location: data.location || "",
            closed: data.closed || false,
            session: data.session_id || "", // Store session ID for update
          });
          setOrgName(data.organization_name || "");
          setSessionName(data.session_name || "");
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchClass();
    } else {
      // Creation mode: fetch organizations and sessions
      setOrgLoading(true);
      setSessionLoading(true);
      setOrgError(null);
      setSessionError(null);
      Promise.all([
        authFetch('/api/organizations/'),
        authFetch('/api/sessions/')
      ]).then(async ([orgResp, sessResp]) => {
        let orgs = [];
        let sess = [];
        if (orgResp.ok) {
          orgs = await orgResp.json();
          // Only active/open organizations
          orgs = orgs.filter(o => !o.closed && o.active !== false);
        }
        if (sessResp.ok) {
          sess = await sessResp.json();
          sess = Array.isArray(sess) ? sess : sess.sessions || [];
          // Only open sessions
          sess = sess.filter(s => !s.closed);
        }
        setOrganizations(orgs);
        setSessions(sess);
        // Set org/session name for display
        const orgObj = orgDefault ? orgs.find(o => String(o.id) === String(orgDefault)) : null;
        setOrgName(orgObj ? orgObj.name : "");
        const sessObj = sessionDefault ? sess.find(s => String(s.id) === String(sessionDefault)) : null;
        setSessionName(sessObj ? sessObj.name : "");
      }).catch(err => {
        setOrgError('Failed to load organizations');
        setSessionError('Failed to load sessions');
      }).finally(() => {
        setOrgLoading(false);
        setSessionLoading(false);
        setLoading(false);
      });
    }
  }, [id, orgDefault, sessionDefault]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Convert time to backend format
      const submitForm = { ...form, time: parseTime12hr(form.time) };
      let resp;
      if (id) {
        resp = await authFetch(`/api/activity/${id}/edit/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitForm)
        });
        if (!resp.ok) throw new Error("Failed to update class");
        navigate(`/classes/${id}`);
      } else {
        // Add session to submitForm (organization is not needed as session already links to it)
        // Use form.session if set, otherwise fall back to sessionDefault from query params
        submitForm.session = form.session || sessionDefault;
        resp = await authFetch('/api/classes/new/', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitForm)
        });
        if (!resp.ok) throw new Error("Failed to create class");
        const data = await resp.json();
        navigate(`/classes/${data.id}`);
      }
    } catch (err) {
      setError(id ? "Failed to update class. Please try again." : "Failed to create class. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || typeChoicesLoading || orgLoading || sessionLoading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (typeChoicesError) return <div className="alert alert-danger">{typeChoicesError}</div>;
  if (orgError) return <div className="alert alert-danger">{orgError}</div>;
  if (sessionError) return <div className="alert alert-danger">{sessionError}</div>;

  // Only show sessions for selected org
  const filteredSessions = form.organization
    ? sessions.filter(s => String(s.organization) === String(form.organization))
    : sessions;

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>{id ? "Edit Class" : "Create Class"}</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">{id ? "Class Edit" : "Class Create"}</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Organization dropdown for create, static for edit */}
            <div className="mb-3">
              <label className="form-label">Organization</label>
              {id ? (
                <input type="text" className="form-control" value={orgName} disabled />
              ) : (
                <select
                  className="form-select"
                  name="organization"
                  value={form.organization || orgDefault || ""}
                  onChange={e => {
                    setForm(f => ({ ...f, organization: e.target.value, session: "" }));
                  }}
                  required
                  disabled={organizations.length === 0}
                >
                  <option value="" disabled>
                    {organizations.length === 0 ? "Loading organizations..." : "Select organization"}
                  </option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              )}
            </div>
            {/* Session dropdown for create, static for edit */}
            <div className="mb-3">
              <label className="form-label">Session</label>
              {id ? (
                <input type="text" className="form-control" value={sessionName} disabled />
              ) : (
                <select
                  className="form-select"
                  name="session"
                  value={form.session || sessionDefault || ""}
                  onChange={e => setForm(f => ({ ...f, session: e.target.value }))}
                  required
                  disabled={filteredSessions.length === 0 || !form.organization}
                >
                  <option value="" disabled>
                    {!form.organization ? "Select organization first" : (filteredSessions.length === 0 ? "No sessions available" : "Select session")}
                  </option>
                  {filteredSessions.map(sess => (
                    <option key={sess.id} value={sess.id}>{sess.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="form-select" required>
                <option value="" disabled>Select type...</option>
                {typeChoices.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Day of Week</label>
              <select name="day_of_week" value={form.day_of_week} onChange={handleChange} className="form-select" required>
                {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="form-label">Time</label>
              <input type="text" name="time" value={form.time} onChange={handleTimeChange} onBlur={handleTimeBlur} className="form-control" required placeholder="e.g. 6:00 PM" />
              <div className="form-text">Format: h:mm AM/PM (e.g. 6:00 PM, 10:30 AM)</div>
            </div>
            <div className="mb-3">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="form-control"
                list="location-list"
                autoComplete="off"
                required
              />
              <datalist id="location-list">
                {locationOptions.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>
              {locationLoading && <div className="form-text">Loading locations...</div>}
              {locationError && <div className="form-text text-danger">{locationError}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label">Status</label>
              <div className="form-check form-switch">
                <input
                  className={`form-check-input ${!form.closed ? 'bg-success border-success' : 'bg-danger border-danger'}`}
                  type="checkbox"
                  id="closedSwitch"
                  name="closed"
                  checked={!form.closed}
                  onChange={e => handleChange({
                    target: {
                      name: 'closed',
                      type: 'checkbox',
                      checked: !e.target.checked
                    }
                  })}
                  style={{ cursor: 'pointer' }}
                />
                <label className="form-check-label ms-2" htmlFor="closedSwitch" style={{ color: !form.closed ? '#198754' : '#dc3545', fontWeight: 'bold' }}>
                  {!form.closed ? 'Open' : 'Closed'}
                </label>
              </div>
            </div>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
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

export default ClassEdit;
