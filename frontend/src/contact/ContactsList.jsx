import React, { useEffect, useState } from "react";
import ContactLink from "../organization/ContactLink";
import { authFetch } from "../utils/authFetch";


function ContactsList() {
  const [contacts, setContacts] = useState([]);
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function fetchContacts() {
      const resp = await authFetch("/api/contacts/");
      if (resp.ok) {
        const data = await resp.json();
        // Support both array and object response formats
        setContacts(Array.isArray(data) ? data : data.contacts || []);
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
      // Case-insensitive string sort
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
            <tr key={contact.id}>
              <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }}>
                <a href={`/contacts/${contact.id}/edit`} className="edit-icon-link" title="Edit">
                  <i className="bi bi-pencil"></i>
                </a>
              </td>
              <td><ContactLink contact={contact} /></td>
              <td>{contact.role}</td>
              <td>{contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : ""}</td>
              <td>{contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : ""}</td>
              <td>{contact.organization_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ContactsList;
