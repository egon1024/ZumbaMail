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
    function fetchContacts() {
      (async () => {
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
      })();
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
                      <Tooltip tooltip={`Call ${contact.name} (office)`}>
                        <a href={`tel:${contact.office_phone}`}>{contact.office_phone}</a>
                      </Tooltip>
                    ) : <span className="text-muted">—</span>}</td>
                    <td>{contact.cell_phone ? (
                      <Tooltip tooltip={`Call ${contact.name} (cell)`}>
                        <a href={`tel:${contact.cell_phone}`}>{contact.cell_phone}</a>
                      </Tooltip>
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
