import React, { useEffect, useState } from "react";
import PhoneDisplay from "../utils/phone/PhoneDisplay";
import Tooltip from "../utils/Tooltip";
import "../utils/phone/PhoneDisplay.css";
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
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="mb-0 me-3" style={{ color: "#6a359c" }}>{contact.name}</h2>
        <button
          className="btn btn-danger"
          onClick={async () => {
            if (window.confirm('Are you sure you want to delete this contact?')) {
              try {
                const resp = await authFetch(`/api/contacts/${id}/delete/`, { method: 'DELETE' });
                if (resp.ok) {
                  navigate('/contacts');
                } else {
                  const data = await resp.json();
                  alert(data.detail || 'Failed to delete contact.');
                }
              } catch (err) {
                alert('Error deleting contact: ' + err.message);
              }
            }
          }}
        >
          <i className="bi bi-trash"></i> Delete
        </button>
      </div>
      <div className="card shadow-sm border-primary mb-4 w-100" style={{ maxWidth: '100%' }}>
        <div className="card-header bg-dark text-white text-start">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Contact Details</h4>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => navigate(`/contacts/new${contact.organization_id ? `?organization=${contact.organization_id}` : ''}`)}
                title="Create New Contact"
              >
                <i className="bi bi-plus-lg me-1"></i> New Contact
              </button>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => navigate(`/contacts/${id}/edit`)}
                title="Edit Contact"
              >
                <i className="bi bi-pencil-square"></i> Edit
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          <table className="table table-sm mb-0" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr className="hover-link-row">
                <th scope="row">Organization</th>
                <td>
                  {contact.organization_id ? (
                    <Tooltip tooltip="View organization details">
                      <a
                        href={`/organization/${contact.organization_id}`}
                        rel="noopener noreferrer"
                        className="phone-display-link"
                      >
                        {contact.organization_name}
                      </a>
                    </Tooltip>
                  ) : contact.organization_name}
                </td>
              </tr>
              <tr>
                <th scope="row">Role</th>
                <td>{contact.role}</td>
              </tr>
              <tr className="hover-link-row">
                <th scope="row">Email</th>
                <td>
                  {contact.email ? (
                    <Tooltip tooltip="Send email">
                      <a
                        href={`mailto:${contact.email}`}
                        rel="noopener noreferrer"
                        className="phone-display-link"
                      >
                        {contact.email}
                      </a>
                    </Tooltip>
                  ) : contact.email}
                </td>
              </tr>
              <tr className="hover-link-row">
                <th scope="row">Office Phone</th>
                <td>
                  {contact.office_phone ? (
                    <PhoneDisplay value={contact.office_phone} tooltip="Call this office number" />
                  ) : <span className="text-muted">—</span>}
                </td>
              </tr>
              <tr className="hover-link-row">
                <th scope="row">Cell Phone</th>
                <td>
                  {contact.cell_phone ? (
                    <PhoneDisplay value={contact.cell_phone} tooltip="Call this cell number" />
                  ) : <span className="text-muted">—</span>}
                </td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 text-end">
            {/* Edit button moved to card header */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactDetails;
