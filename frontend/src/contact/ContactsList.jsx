import React, { useEffect, useState } from "react";
import Tooltip from "../utils/Tooltip";
import PhoneDisplay from "../utils/phone/PhoneDisplay";
import ContactLink from "../organization/ContactLink";
import "../organization/OrganizationDetails.css";
import { authFetch } from "../utils/authFetch";
import { useLocation } from "react-router-dom";


function ContactsList() {
  const location = useLocation();
  const [contacts, setContacts] = useState([]);
  const [organizations, setOrganizations] = useState([]); // New state for organizations
  const [selectedOrg, setSelectedOrg] = useState(() => { // New state for selected organization
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('organization') || '';
  });
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredContactId, setHoveredContactId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let contactsUrl = "/api/contacts/";
        if (selectedOrg) {
          contactsUrl += `?organization=${selectedOrg}`;
        }

        const [contactsRes, orgsRes] = await Promise.all([
          authFetch(contactsUrl),
          authFetch('/api/organizations/')
        ]);

        if (!contactsRes.ok) throw new Error('Failed to fetch contacts');
        if (!orgsRes.ok) throw new Error('Failed to fetch organizations');

        const contactsData = await contactsRes.json();
        const orgsData = await orgsRes.json();

        setContacts(Array.isArray(contactsData) ? contactsData : contactsData.contacts || []);
        setOrganizations(orgsData);
      } catch (err) {
        setError(err.message);
      } finally {
        // setLoading(false); // No loading state in this component yet
      }
    };
    fetchData();
  }, [selectedOrg]); // Re-fetch when selectedOrg changes

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function getSortedContacts() {
    const sorted = [...contacts].sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      valA = typeof valA === 'string' ? valA.toLowerCase() : valA;
      valB = typeof valB === 'string' ? valB.toLowerCase() : valB;
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Contacts</h4>
          <button
            className="btn btn-sm btn-success"
            onClick={() => window.location.href = '/contacts/new'}
            title="Add New Contact"
          >
            <i className="bi bi-plus-lg"></i> New Contact
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
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {!error && (
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('role')}>
                    Role {sortField === 'role' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th>Email</th>
                  <th>Office Phone</th>
                  <th>Cell Phone</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('organization_name')}>
                    Organization {sortField === 'organization_name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedContacts().map(contact => (
                  <tr key={contact.id} className="reactive-contact-row">
                    <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }}>
                      <Tooltip tooltip="Edit contact">
                        <a
                          href={`/contacts/${contact.id}/edit`}
                          style={{ border: 'none', background: 'none', padding: 0, outline: 'none', boxShadow: 'none' }}
                          tabIndex={0}
                        >
                          <i className="bi bi-pencil-square" style={{ fontSize: '1.2em', color: '#6a359c', verticalAlign: 'middle' }}></i>
                        </a>
                      </Tooltip>
                    </td>
                    <td
                      onMouseEnter={() => setHoveredContactId(contact.id)}
                      onMouseLeave={() => setHoveredContactId(null)}
                    >
                      <Tooltip tooltip={`View contact details for ${contact.name}`}>
                        <a
                          href={`/contacts/${contact.id}`}
                          className={`contact-name-link${hoveredContactId === contact.id ? ' contact-hovered' : ''}`}
                          style={{ color: hoveredContactId === contact.id ? '#007bff' : '', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {contact.name}
                        </a>
                      </Tooltip>
                    </td>
                    <td
                      onMouseEnter={() => setHoveredContactId(contact.id)}
                      onMouseLeave={() => setHoveredContactId(null)}
                    >
                      <Tooltip tooltip={`View contact details for ${contact.name}`}>
                        <a
                          href={`/contacts/${contact.id}`}
                          className={`contact-role-link${hoveredContactId === contact.id ? ' contact-hovered' : ''}`}
                          style={{ color: hoveredContactId === contact.id ? '#007bff' : '', textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {contact.role}
                        </a>
                      </Tooltip>
                    </td>
                    <td>{contact.email ? (
                      <Tooltip tooltip={`Email ${contact.name}`}>
                        <a href={`mailto:${contact.email}`}>{contact.email}</a>
                      </Tooltip>
                    ) : ""}</td>
                    <td>{contact.office_phone ? (
                      <PhoneDisplay value={contact.office_phone} tooltip={`Call ${contact.name} (office)`} />
                    ) : <span className="text-muted">—</span>}</td>
                    <td>{contact.cell_phone ? (
                      <PhoneDisplay value={contact.cell_phone} tooltip={`Call ${contact.name} (cell)`} />
                    ) : <span className="text-muted">—</span>}</td>
                    <td>
                      {contact.organization_id ? (
                        <Tooltip tooltip={`View details for ${contact.organization_name}`}>
                          <a
                            href={`/organization/${contact.organization_id}`}
                            className="reactive-student-contact-link"
                          >
                            {contact.organization_name}
                          </a>
                        </Tooltip>
                      ) : <span className="text-muted">—</span>}
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

export default ContactsList;
