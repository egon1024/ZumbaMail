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
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Organizations</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Organizations</h4>
        </div>
        <div className="card-body">
          {loading && <p>Loading...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && (
            <table className="table table-striped table-sm" style={{ width: 'auto', minWidth: '0', margin: '0 auto' }}>
              <thead>
                <tr>
                  <th style={{ width: 'fit-content', textAlign: 'center', padding: 0 }}></th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.25rem' }}>Contacts</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => (
                  <tr key={org.id}>
                    <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }}>
                      <Link to={`/organization/edit/${org.id}`} className="edit-icon-link" title="Edit">
                        <i className="bi bi-pencil"></i>
                      </Link>
                    </td>
                    <td style={{ textAlign: 'left', padding: '0.25rem' }}>
                      <Organization organization={org} />
                    </td>
                    <td style={{ textAlign: 'left', padding: '0.25rem' }}>{org.contact_count ?? (org.contacts ? org.contacts.length : 0)}</td>
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
