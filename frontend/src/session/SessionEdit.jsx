import React, { useEffect, useState } from "react";
import { formatDate } from "../utils/formatDate";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import '../organization/OrganizationDetails.css';

function SessionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', closed: false, start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [dateWarning, setDateWarning] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const resp = await authFetch(`/api/sessions/${id}/`);
        if (!resp.ok) throw new Error("Failed to fetch session details");
        const data = await resp.json();
        setSession(data.session);
        setForm({
          name: data.session.name || '',
          closed: !!data.session.closed,
          start_date: data.session.start_date || '',
          end_date: data.session.end_date || ''
        });
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleDateChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setDateWarning(null);
    setError(null);

    // Client-side validation
    if (name === 'start_date' && session) {
      if (value > session.start_date) {
        setDateWarning('Warning: Start date can only be moved earlier (to expand the session). You cannot move it forward.');
        return;
      }
      if (value > form.end_date) {
        setDateWarning('Warning: Start date must be before the end date.');
        return;
      }
      if (value < session.start_date) {
        setDateWarning(`You are expanding the session start date from ${formatDate(session.start_date)} to ${formatDate(value)}. This will allow activities and attendance to be recorded for earlier dates.`);
      }
    }

    if (name === 'end_date' && session) {
      if (value < session.end_date) {
        setDateWarning('Warning: End date can only be moved later (to expand the session). You cannot move it backward.');
        return;
      }
      if (value < form.start_date) {
        setDateWarning('Warning: End date must be after the start date.');
        return;
      }
      if (value > session.end_date) {
        setDateWarning(`You are expanding the session end date from ${formatDate(session.end_date)} to ${formatDate(value)}. This will allow activities and attendance to be recorded for later dates.`);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDateWarning(null);

    // Validate dates before submitting
    if (form.start_date > session.start_date) {
      setError('Start date can only be moved earlier. You cannot move it forward.');
      setSaving(false);
      return;
    }
    if (form.end_date < session.end_date) {
      setError('End date can only be moved later. You cannot move it backward.');
      setSaving(false);
      return;
    }
    if (form.end_date <= form.start_date) {
      setError('End date must be after start date.');
      setSaving(false);
      return;
    }

    try {
      const resp = await authFetch(`/api/sessions/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          closed: form.closed,
          start_date: form.start_date,
          end_date: form.end_date
        })
      });
      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.start_date || errorData.end_date || 'Failed to update session');
      }
      navigate(`/sessions/${id}`);
    } catch (err) {
      setError(err.message || "Failed to update session. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!session) return <div>No session found.</div>;

  return (
    <div className="container mt-4">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {dateWarning && (
        <div className="alert alert-info" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          {dateWarning}
        </div>
      )}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Edit Session</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <table className="table table-sm mb-0">
              <tbody>
                <tr>
                  <th>Name</th>
                  <td>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </td>
                </tr>
                <tr>
                  <th>Status</th>
                  <td>
                    <div className="form-check form-switch d-flex align-items-center">
                      <input
                        className={`form-check-input ${form.closed ? 'bg-danger border-danger' : 'bg-success border-success'}`}
                        type="checkbox"
                        id="closedSwitch"
                        name="closed"
                        checked={!form.closed} // right means open
                        onChange={e => setForm(f => ({ ...f, closed: !e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <label
                        className="form-check-label ms-2"
                        htmlFor="closedSwitch"
                        style={{ color: form.closed ? '#dc3545' : '#198754', fontWeight: 'bold' }}
                      >
                        {form.closed ? 'Closed' : 'Open'}
                      </label>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>Start Date</th>
                  <td>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleDateChange}
                      className="form-control"
                      required
                    />
                    <small className="text-muted">
                      Original: {formatDate(session.start_date)}. Can only be moved earlier to expand the session.
                    </small>
                  </td>
                </tr>
                <tr>
                  <th>End Date</th>
                  <td>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleDateChange}
                      className="form-control"
                      required
                    />
                    <small className="text-muted">
                      Original: {formatDate(session.end_date)}. Can only be moved later to expand the session.
                    </small>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(-1)} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SessionEdit;
