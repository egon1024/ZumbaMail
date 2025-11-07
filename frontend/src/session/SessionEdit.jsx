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
  const [form, setForm] = useState({ name: '', closed: false });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const resp = await authFetch(`/api/sessions/${id}/`);
        if (!resp.ok) throw new Error("Failed to fetch session details");
        const data = await resp.json();
        setSession(data.session);
        setForm({ name: data.session.name || '', closed: !!data.session.closed });
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
  const resp = await authFetch(`/api/sessions/${id}/update/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, closed: form.closed })
      });
      if (!resp.ok) throw new Error("Failed to update session");
      navigate(`/sessions/${id}`);
    } catch (err) {
      setError("Failed to update session. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!session) return <div>No session found.</div>;

  return (
    <div className="container mt-4">
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
                <tr><th>Start Date</th><td>{formatDate(session.start_date)}</td></tr>
                <tr><th>End Date</th><td>{formatDate(session.end_date)}</td></tr>
                {/* Add more fields here as needed, but only name and status are editable */}
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
