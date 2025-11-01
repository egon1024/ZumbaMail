import React, { useEffect, useState } from "react";
import ContactLink from "../organization/ContactLink";
import { authFetch } from "../utils/authFetch";

function ContactsList() {
  const [contacts, setContacts] = useState([]);
  useEffect(() => {
    async function fetchContacts() {
      const resp = await authFetch("/api/contacts/");
      if (resp.ok) {
        const data = await resp.json();
        setContacts(data.contacts || []);
      }
    }
    fetchContacts();
  }, []);

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: "#6a359c" }}>Contacts</h2>
      <table className="table table-sm mb-0">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Organization</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(contact => (
            <tr key={contact.id}>
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
