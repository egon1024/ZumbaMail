import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function LocationEdit() {
  const { id } = useParams(); // Will be undefined for create mode
  const navigate = useNavigate();
  const reactLocation = useLocation(); // Renamed to avoid conflict with location state

  // Parse query params for organization default in create mode
  const queryParams = new URLSearchParams(reactLocation.search);
  const orgDefault = queryParams.get('organization');

  const [form, setForm] = useState({
    name: "",
    address: "",
    description: "",
    organization: orgDefault || "", // Set default from query param
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [orgLoading, setOrgLoading] = useState(false);
  const [orgError, setOrgError] = useState(null);

  useEffect(() => {
    const isEditMode = id && !isNaN(Number(id));

    if (isEditMode) {
      // Edit mode: fetch existing location data
      async function fetchLocation() {
        setLoading(true);
        try {
          const resp = await authFetch(`/api/locations/${id}/`);
          if (!resp.ok) throw new Error("Location not found");
          const data = await resp.json();
          setForm({
            name: data.name || "",
            address: data.address || "",
            description: data.description || "",
            organization: data.organization || "", // Organization ID
            organization_name: data.organization_name || "", // Organization Name
          });
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchLocation();
    } else {
      // Create mode: fetch organizations
      setOrgLoading(true);
      setOrgError(null);
      authFetch('/api/organizations/')
        .then(resp => resp.json())
        .then(data => {
          setOrganizations(data.filter(o => !o.is_deleted)); // Only active organizations
        })
        .catch(err => {
          setOrgError('Failed to load organizations');
        })
        .finally(() => {
          setOrgLoading(false);
          setLoading(false); // Finished initial loading for create mode
        });
    }
  }, [id, orgDefault]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let resp;
      if (id) {
        // Edit existing location
        resp = await authFetch(`/api/locations/${id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error("Failed to update location");
        navigate(`/locations/${id}`);
      } else {
        // Create new location
        resp = await authFetch('/api/locations/new/', {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form)
        });
        if (!resp.ok) throw new Error("Failed to create location");
        const data = await resp.json();
        navigate(`/locations/${data.id}`);
      }
    } catch (err) {
      setError(err.message || (id ? "Failed to update location. Please try again." : "Failed to create location. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  if (loading || orgLoading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (orgError) return <div className="alert alert-danger">{orgError}</div>;

  const isEditMode = id && !isNaN(Number(id));

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>{isEditMode ? "Edit Location" : "Create Location"}</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">{isEditMode ? "Location Edit" : "Location Create"}</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Organization dropdown for create, static for edit */}
            <div className="mb-3">
              <label className="form-label">Organization</label>
              {isEditMode ? (
                <input type="text" className="form-control" value={form.organization_name || "Loading..."} disabled />
              ) : (
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
              )}
            </div>

            <div className="mb-3">
              <label className="form-label">Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
              ></textarea>
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

export default LocationEdit;
