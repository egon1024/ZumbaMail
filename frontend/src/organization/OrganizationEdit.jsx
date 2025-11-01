import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function OrganizationEdit() {
  const { id } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchOrg() {
      try {
        const resp = await authFetch(`/api/organizations/${id}/details/`);
        if (!resp.ok) throw new Error("Organization not found");
        const data = await resp.json();
        setOrg(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const resp = await authFetch(`/api/organizations/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: org.name }),
      });
      if (!resp.ok) throw new Error("Failed to update organization");
      navigate(`/organization/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    setOrg({ ...org, name: e.target.value });
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!org) return null;

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Edit Organization</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Organization Edit</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" name="name" value={org.name} onChange={handleChange} required />
            </div>
            <div className="text-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(`/organization/${id}`)} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrganizationEdit;
