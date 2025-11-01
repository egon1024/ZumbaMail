import React, { useEffect, useState } from "react";
import './ContactDetails.css';
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

function ContactDetails() {
  const { id } = useParams();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchContact() {
      try {
        const resp = await authFetch(`/api/contacts/${id}/`);
        if (!resp.ok) throw new Error("Contact not found");
        const data = await resp.json();
        setContact(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContact();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!contact) return null;

  return (
    <div className="container mt-4 d-flex flex-column align-items-center">
      <h2 className="mb-4" style={{ color: "#6a359c" }}>{contact.name}</h2>
      <div className="card shadow-sm border-primary mb-4 w-100" style={{ maxWidth: 500 }}>
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Contact Details</h4>
        </div>
        <div className="card-body">
          <table className="table table-sm mb-0" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr
                className="hover-link-row"
                style={{ borderBottom: '2px solid #222', cursor: contact.organization_id ? 'pointer' : 'default' }}
                onClick={() => contact.organization_id && window.location.assign(`/organization/${contact.organization_id}`)}
              >
                <th scope="row">Organization</th>
                <td>
                  {contact.organization_name}
                </td>
              </tr>
              <tr style={{ borderBottom: '2px solid #222' }}>
                <th scope="row">Role</th>
                <td>{contact.role}</td>
              </tr>
              <tr
                className="hover-link-row"
                style={{ borderBottom: '2px solid #222', cursor: contact.email ? 'pointer' : 'default' }}
                onClick={() => contact.email && window.location.assign(`mailto:${contact.email}`)}
              >
                <th scope="row">Email</th>
                <td>{contact.email}</td>
              </tr>
              <tr
                className="hover-link-row"
                style={{ cursor: contact.phone ? 'pointer' : 'default' }}
                onClick={() => contact.phone && window.location.assign(`tel:${contact.phone}`)}
              >
                <th scope="row">Phone</th>
                <td>{contact.phone}</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-end">
            <button
              className="btn btn-primary me-2"
              onClick={() => navigate(`/contacts/${id}/edit`)}
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactDetails;
