import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { Link } from 'react-router-dom';
import Organization from './OrganizationLink';

function ListOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await authFetch('/api/organizations/');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, []);
  return (
    <div className="container mt-4">
      <h2 style={{ color: '#6a359c' }} className="mb-4">Organizations</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Organizations</h4>
          <button className="btn btn-sm btn-success" onClick={() => window.location.href = '/organization/new'}>
            <i className="bi bi-plus-lg me-1"></i> New Organization
          </button>
        </div>
        <div className="card-body">
          {loading && <p>Loading...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && (
            <table className="table table-striped table-sm mb-0">
              <thead>
                <tr>
                  <th className="text-center" style={{ width: '1%' }}></th>
                  <th>Name</th>
                  <th>Contacts</th>
                  <th>Locations</th>
                </tr>
              </thead>
              <tbody>
                {[...organizations].sort((a, b) => a.name.localeCompare(b.name)).map(org => (
                  <tr key={org.id} className="reactive-contact-row">
                    <td className="align-top text-center" style={{ width: '1%' }}>
                      <Link
                        to={`/organization/${org.id}/edit`}
                        className="plain-link"
                        tabIndex={0}
                        title="Edit"
                      >
                        <i className="bi bi-pencil-square" style={{ fontSize: '1.2em', color: '#6a359c', verticalAlign: 'middle' }}></i>
                      </Link>
                    </td>
                    <td className="align-top">
                      <Organization organization={org} />
                    </td>
                    <td className="align-top">
                      <Link to={`/contacts?organization=${org.id}`} className="clickable-text">
                        {org.contact_count ?? (org.contacts ? org.contacts.length : 0)}
                      </Link>
                    </td>
                    <td className="align-top">
                      <Link to={`/locations?organization=${org.id}`} className="clickable-text">
                        {org.num_locations}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default ListOrganizations;
