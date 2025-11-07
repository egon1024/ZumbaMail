import React, { useState, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import { useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function ContactCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [organizations, setOrganizations] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", extension: "", role: "", organization: "" });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchOrgsAndSetDefault() {
      const params = new URLSearchParams(location.search);
      const orgParam = params.get("organization");
      let orgs = [];
      try {
        const resp = await authFetch("/api/organizations/");
        if (resp.ok) {
          orgs = await resp.json();
          setOrganizations(orgs);
        }
      } catch {}
      // If org param, select it; else if only one org, select it
      if (orgParam && orgs.some(o => String(o.id) === String(orgParam))) {
        setForm(f => ({ ...f, organization: orgParam }));
      } else if (orgs.length === 1) {
        setForm(f => ({ ...f, organization: orgs[0].id }));
      }
    }
    fetchOrgsAndSetDefault();
  }, [location.search]);

  function isValidEmail(email) {
    // Simple RFC 5322 compliant regex for most cases
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => {
      const updated = { ...f, [name]: value };
      // Live email validation (only if not empty)
      if (name === 'email' && value) {
        if (!isValidEmail(value)) {
          return { ...updated, emailError: 'Please enter a valid email address.' };
        } else {
          const { emailError, ...rest } = updated;
          return rest;
        }
      }
      if (name === 'email' && !value) {
        const { emailError, ...rest } = updated;
        return rest;
      }
      return updated;
    });
  }

  // Helper to merge phone and extension for storage
  function getPhoneWithExt() {
    if (form.extension && form.extension.trim() !== "") {
      return `${form.phone} x${form.extension}`;
    }
    return form.phone;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    // Client-side email validation (only if not empty)
    if (form.email && !isValidEmail(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      // Ensure organization is a number if present
      const submitData = { ...form, phone: getPhoneWithExt() };
      delete submitData.extension;
      delete submitData.emailError;
      if (submitData.organization) {
        submitData.organization = Number(submitData.organization);
      }
      const resp = await authFetch("/api/contacts/new/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      if (!resp.ok) {
        let errMsg = "Failed to create contact";
        try {
          const data = await resp.json();
          if (data && typeof data === 'object') {
            errMsg += ': ' + Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
          }
        } catch {}
        throw new Error(errMsg);
      }
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
            <div className="mb-3">
              <label className="form-label">Organization</label>
              <select
                className="form-select"
                name="organization"
                value={form.organization}
                onChange={handleChange}
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
            </div>
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
              <input
                type="email"
                className={`form-control${form.emailError ? ' is-invalid' : ''}`}
                name="email"
                value={form.email}
                onChange={handleChange}
              />
              {form.emailError && (
                <div className="invalid-feedback">{form.emailError}</div>
              )}
            </div>
            <div className="mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-8">
                  <label className="form-label">Phone</label>
                  <PhoneInput
                    country={'us'}
                    value={form.phone}
                    onChange={value => setForm(f => ({ ...f, phone: value }))}
                    inputProps={{ name: 'phone', required: false, className: 'form-control' }}
                    enableSearch
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Ext.</label>
                  <input
                    type="text"
                    className="form-control"
                    name="extension"
                    value={form.extension}
                    onChange={handleChange}
                    aria-label="Extension"
                  />
                </div>
              </div>
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
