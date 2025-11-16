import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

function LocationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch(`/api/locations/${id}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch location details');
        }
        const data = await response.json();
        setLocation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [id]);

  if (loading) {
    return <div className="container mt-4">Loading...</div>;
  }

  if (error) {
    return <div className="container mt-4 alert alert-danger">{error}</div>;
  }

  if (!location) {
    return <div className="container mt-4">Location not found.</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">{location.name}</h4>
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-success"
              onClick={() => navigate('/locations/new')}
              title="Create New Location"
            >
              <i className="bi bi-plus-lg me-1"></i> New Location
            </button>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={() => navigate(`/locations/${location.id}/edit`)}
              title="Edit Location"
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          </div>
        </div>
        <div className="card-body">
          <table className="table table-sm mb-0">
            <tbody>
              <tr>
                <th scope="row">Organization</th>
                <td>
                  {location.organization ? (
                    <Link to={`/organization/${location.organization_id}`}>
                      {location.organization_name}
                    </Link>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
              </tr>
              <tr>
                <th scope="row">Name</th>
                <td>{location.name}</td>
              </tr>
              <tr>
                <th scope="row">Address</th>
                <td>{location.address || <span className="text-muted">—</span>}</td>
              </tr>
              <tr>
                <th scope="row">Description</th>
                <td>{location.description || <span className="text-muted">—</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default LocationDetail;
