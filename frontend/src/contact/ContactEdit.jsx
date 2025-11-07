import React, { useEffect, useState } from "react";
import PhoneInput from 'react-phone-input-2';
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function ContactEdit() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [officePhone, setOfficePhone] = useState("");
  const [officeExtension, setOfficeExtension] = useState("");
  const [cellPhone, setCellPhone] = useState("");
  const [organizations, setOrganizations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchContactAndOrgs() {
      try {
        // Fetch organizations
        const orgResp = await authFetch('/api/organizations/');
        let orgs = [];
        if (orgResp.ok) {
          orgs = await orgResp.json();
          setOrganizations(orgs);
        }
        // Fetch contact
        const resp = await authFetch(`/api/contacts/${id}/`);
        if (!resp.ok) throw new Error("Contact not found");
        const data = await resp.json();
        setContact(data);
        // Parse office_phone and extension
        if (data.office_phone) {
          const match = data.office_phone.match(/^(.*?)(?:\s*(?:x|ext\.?|extension)\s*(\d+))?$/i);
          let mainPhone = match ? match[1].trim() : data.office_phone;
          let digitsOnly = mainPhone.replace(/[^\d+]/g, '');
          if (digitsOnly.startsWith('+')) {
            mainPhone = digitsOnly;
          } else {
            const justDigits = digitsOnly.replace(/\D/g, '');
            if (justDigits.length === 10) {
              mainPhone = '+1' + justDigits;
            } else {
              mainPhone = digitsOnly;
            }
          }
          setOfficePhone(mainPhone);
          setOfficeExtension(match && match[2] ? match[2] : "");
        }
        if (data.cell_phone) {
          setCellPhone(data.cell_phone);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContactAndOrgs();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      let officeWithExt = officePhone;
      if (officeExtension && officeExtension.trim() !== "") {
        officeWithExt = `${officePhone} x${officeExtension}`;
      }
      const resp = await authFetch(`/api/contacts/${id}/`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contact.name,
          email: contact.email,
          office_phone: officeWithExt,
          cell_phone: cellPhone,
          role: contact.role,
          organization: contact.organization,
        }),
      });
      if (!resp.ok) {
        let errMsg = "Failed to update contact";
        try {
          const data = await resp.json();
          if (data && typeof data === 'object') {
            errMsg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
          }
        } catch {}
        throw new Error(errMsg);
      }
      navigate(`/contacts/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(e) {
    setContact({ ...contact, [e.target.name]: e.target.value });
  }
  function handleOrgChange(e) {
    setContact({ ...contact, organization: e.target.value });
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!contact) return null;

  return (
    <div className="container mt-4" style={{ maxWidth: 500 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Edit Contact</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Contact Edit</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Organization</label>
              <select
                className="form-select"
                name="organization"
                value={contact.organization || ''}
                onChange={handleOrgChange}
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
              <input type="text" className="form-control" name="name" value={contact.name} onChange={handleChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Role</label>
              <input type="text" className="form-control" name="role" value={contact.role} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" name="email" value={contact.email || ""} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-8">
                  <label className="form-label">Office Phone</label>
                  <PhoneInput
                    country={'us'}
                    value={officePhone}
                    onChange={value => setOfficePhone(value)}
                    inputProps={{ name: 'office_phone', required: false, className: 'form-control' }}
                    enableSearch
                  />
                </div>
                <div className="col-4">
                  <label className="form-label">Ext.</label>
                  <input
                    type="text"
                    className="form-control"
                    name="office_extension"
                    value={officeExtension}
                    onChange={e => setOfficeExtension(e.target.value)}
                    aria-label="Extension"
                  />
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Cell Phone</label>
              <PhoneInput
                country={'us'}
                value={cellPhone}
                onChange={value => setCellPhone(value)}
                inputProps={{ name: 'cell_phone', required: false, className: 'form-control' }}
                enableSearch
              />
            </div>
            <div className="text-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate(`/contacts/${id}`)} disabled={saving}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ContactEdit;
