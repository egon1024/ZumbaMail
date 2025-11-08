import React, { useState, useEffect } from "react";
import PhoneInput from 'react-phone-input-2';
import { useNavigate, useSearchParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function StudentCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const nameParam = searchParams.get('name');

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    rochester: false,
    active: true,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    facebook_profile: "",
    notes: ""
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Pre-fill name if provided in URL
  useEffect(() => {
    if (nameParam) {
      const [firstName, ...lastNameParts] = nameParam.trim().split(/\s+/);
      const lastName = lastNameParts.join(' ') || '';
      setForm(f => ({
        ...f,
        first_name: firstName || '',
        last_name: lastName
      }));
    }
  }, [nameParam]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const resp = await authFetch("/api/students/new/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.detail || "Failed to create student");
        setSaving(false);
        return;
      }
      const data = await resp.json();

      // If returnUrl is provided, navigate there; otherwise go to student detail
      if (returnUrl) {
        navigate(returnUrl);
      } else {
        navigate(`/students/${data.id}`);
      }
    } catch (err) {
      setError("Unable to connect to backend server.");
      setSaving(false);
    }
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Create New Student</h4>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">First Name</label>
                <input type="text" className="form-control" name="first_name" value={form.first_name} onChange={handleChange} required />
              </div>
              <div className="col-md-6">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone</label>
                <PhoneInput
                  country={'us'}
                  value={form.phone}
                  onChange={value => setForm(f => ({ ...f, phone: value }))}
                  inputProps={{ name: 'phone', required: false, className: 'form-control' }}
                  enableSearch
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Emergency Contact Name</label>
                <input type="text" className="form-control" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Emergency Contact Phone</label>
                <PhoneInput
                  country={'us'}
                  value={form.emergency_contact_phone}
                  onChange={value => setForm(f => ({ ...f, emergency_contact_phone: value }))}
                  inputProps={{ name: 'emergency_contact_phone', required: false, className: 'form-control' }}
                  enableSearch
                />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Facebook Profile</label>
                <input type="text" className="form-control" name="facebook_profile" value={form.facebook_profile} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Notes</label>
                <textarea className="form-control" name="notes" value={form.notes} onChange={handleChange} rows={2} />
              </div>
            </div>
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="rochester" checked={form.rochester} onChange={handleChange} id="rochesterCheck" />
                  <label className="form-check-label" htmlFor="rochesterCheck">Rochester Resident</label>
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" name="active" checked={form.active} onChange={handleChange} id="activeCheck" />
                  <label className="form-check-label" htmlFor="activeCheck">Active</label>
                </div>
              </div>
            </div>
            <div className="mt-4 text-end">
              <button type="submit" className="btn btn-success" disabled={saving}>
                {saving ? "Saving..." : "Create Student"}
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

export default StudentCreate;
