import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function LocationCreate() {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [organization, setOrganization] = useState(""); // Stores organization ID
  const [organizations, setOrganizations] = useState([]); // List of organizations for dropdown
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const resp = await authFetch("/api/organizations/");
        if (resp.ok) {
          const data = await resp.json();
          // Sort organizations alphabetically by name
          const sortedOrganizations = data.sort((a, b) => a.name.localeCompare(b.name));
          setOrganizations(sortedOrganizations);
          if (sortedOrganizations.length > 0) {
            setOrganization(sortedOrganizations[0].id); // Set default to first organization
          }
        } else {
          setError("Failed to load organizations for dropdown.");
        }
      } catch (err) {
        setError("Unable to connect to backend server to load organizations.");
      }
    };
    fetchOrganizations();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const newLocation = {
      name,
      address,
      description,
      organization: parseInt(organization), // Ensure organization ID is an integer
    };

    try {
      const resp = await authFetch("/api/locations/new/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLocation),
      });
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.detail || JSON.stringify(errorData));
      }
      const data = await resp.json();
      navigate(`/locations/${data.id}`); // Navigate to the new location's detail page
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Create Location</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">New Location</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="organization" className="form-label">Organization</label>
              <select 
                className="form-select" 
                id="organization"
                value={organization} 
                onChange={e => setOrganization(e.target.value)} 
                required
              >
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input 
                type="text" 
                className="form-control" 
                id="name"
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-3">
              <label htmlFor="address" className="form-label">Address</label>
              <input 
                type="text" 
                className="form-control" 
                id="address"
                value={address} 
                onChange={e => setAddress(e.target.value)} 
                required 
              />
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea 
                className="form-control" 
                id="description"
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows="3"
              ></textarea>
            </div>
            <div className="text-end">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Create"}
              </button>
              <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/locations")} disabled={saving}>
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

export default LocationCreate;
