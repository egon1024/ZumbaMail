import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { Link, useNavigate } from 'react-router-dom';

function LocationList() {
  const [locations, setLocations] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [locationsRes, orgsRes] = await Promise.all([
          authFetch('/api/locations/'),
          authFetch('/api/organizations/')
        ]);
        if (!locationsRes.ok) throw new Error('Failed to fetch locations');
        if (!orgsRes.ok) throw new Error('Failed to fetch organizations');
        
        const locationsData = await locationsRes.json();
        const orgsData = await orgsRes.json();
        
        setLocations(locationsData);
        setOrganizations(orgsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredLocations = selectedOrg
    ? locations.filter(loc => loc.organization === parseInt(selectedOrg))
    : locations;

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function getSortedLocations() {
    const sorted = [...filteredLocations].sort((a, b) => {
      const valA = (sortField === 'organization' ? a.organization_name : a[sortField]) || '';
      const valB = (sortField === 'organization' ? b.organization_name : b[sortField]) || '';
      
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortAsc ? -1 : 1;
      if (strA > strB) return strB < strA ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: '#6a359c' }}>Locations</h2>
      </div>

      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">All Locations</h4>
          <button
            className="btn btn-success btn-sm"
            onClick={() => navigate('/locations/new')}
            title="Add New Location"
          >
            <i className="bi bi-plus-lg me-1"></i> New Location
          </button>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label htmlFor="organizationFilter" className="form-label">Filter by Organization</label>
            <select 
              id="organizationFilter" 
              className="form-select" 
              value={selectedOrg} 
              onChange={e => setSelectedOrg(e.target.value)}
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>

          {loading && <p>Loading...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th style={{ width: 'fit-content', textAlign: 'center', padding: 0 }}></th>
                    <th onClick={() => handleSort('organization')} style={{cursor: 'pointer'}}>
                      Organization {sortField === 'organization' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th onClick={() => handleSort('name')} style={{cursor: 'pointer'}}>
                      Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                    </th>
                    <th>Address</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {getSortedLocations().map(loc => (
                    <tr 
                      key={loc.id}
                      onMouseEnter={() => setHoveredRowId(loc.id)}
                      onMouseLeave={() => setHoveredRowId(null)}
                    >
                      <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }} className="align-top">
                        <Link
                          to={`/locations/${loc.id}/edit`}
                          style={{ border: 'none', background: 'none', padding: 0, outline: 'none', boxShadow: 'none' }}
                          tabIndex={0}
                          title="Edit"
                        >
                          <i className="bi bi-pencil-square" style={{ fontSize: '1.2em', color: '#6a359c', verticalAlign: 'middle' }}></i>
                        </Link>
                      </td>
                      <td className="align-top" onMouseEnter={(e) => e.stopPropagation()}>
                        <Link to={`/organization/${loc.organization_id}`} className="clickable-text">
                          {loc.organization_name}
                        </Link>
                      </td>
                      <td 
                        className="align-top"
                      >
                        <Link to={`/locations/${loc.id}`} className={hoveredRowId === loc.id ? 'active-name' : 'plain-link'}>
                          {loc.name}
                        </Link>
                      </td>
                      <td 
                        className="align-top"
                      >
                        <Link to={`/locations/${loc.id}`} className="plain-link">
                          {loc.address}
                        </Link>
                      </td>
                      <td 
                        className="align-top text-wrap"
                      >
                        <Link to={`/locations/${loc.id}`} className="plain-link">
                          {loc.description}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LocationList;
