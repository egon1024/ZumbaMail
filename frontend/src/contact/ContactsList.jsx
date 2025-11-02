import React, { useEffect, useState } from "react";
import Tooltip from "../utils/Tooltip";
import ContactLink from "../organization/ContactLink";
import "../organization/OrganizationDetails.css";
import { authFetch } from "../utils/authFetch";



function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredContactId, setHoveredContactId] = useState(null);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const resp = await authFetch("/api/contacts/");
        if (resp.ok) {
          const data = await resp.json();
          setContacts(Array.isArray(data) ? data : data.contacts || []);
        } else {
          setError("Failed to retrieve contacts from backend.");
        }
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      }
    }
    fetchContacts();
  }, []);

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
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Contacts</h2>
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
              <th>Phone</th>
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
                    <a href={`/contacts/${contact.id}/edit`} className="edit-icon-link">
                      <i className="bi bi-pencil"></i>
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
                <td>{contact.phone ? (
                  <Tooltip tooltip={`Call ${contact.name}`}>
                    <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                  </Tooltip>
                ) : ""}</td>
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
  );
}

export default ContactsList;
