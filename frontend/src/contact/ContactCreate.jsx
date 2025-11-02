import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function ContactCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [orgId, setOrgId] = useState("");
  const [orgName, setOrgName] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", role: "", organization: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const org = params.get("organization");
    if (org) {
      setOrgId(org);
      setForm(f => ({ ...f, organization: org }));
      // Fetch organization name for display
      authFetch(`/api/organizations/${org}/details/`).then(resp => {
        if (resp.ok) {
          resp.json().then(data => setOrgName(data.name));
        }
      });
    }
  }, [location.search]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const resp = await authFetch("/api/contacts/new/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!resp.ok) throw new Error("Failed to create contact");
      const data = await resp.json();
      navigate(`/contacts/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Create Contact</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">New Contact</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {orgId && (
              <div className="mb-3">
                <label className="form-label">Organization</label>
                <input type="text" className="form-control" value={orgName || orgId} disabled />
                <input type="hidden" name="organization" value={orgId} />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <input type="text" className="form-control" name="role" value={form.role} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Phone</label>
              <input type="text" className="form-control" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="text-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Create"}
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

export default ContactCreate;
