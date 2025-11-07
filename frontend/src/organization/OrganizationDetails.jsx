import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Organization from "./OrganizationLink";
import Tooltip from "../utils/Tooltip";
import ContactLink from "./ContactLink";
import { authFetch } from "../utils/authFetch";
import { formatDate } from "../utils/formatDate";
import SessionLink from "./SessionLink";
import './OrganizationDetails.css';
import DayOfWeekDisplay from "../utils/DayOfWeekDisplay";


function OrganizationDetails() {
  // Contact sorting state and logic
  const [contactSortField, setContactSortField] = useState('name');
  const [contactSortAsc, setContactSortAsc] = useState(true);
  function handleContactSort(field) {
    if (contactSortField === field) {
      setContactSortAsc(!contactSortAsc);
    } else {
      setContactSortField(field);
      setContactSortAsc(true);
    }
  }
  function getSortedContacts() {
    if (!organization || !organization.contacts) return [];
    const sorted = [...organization.contacts].sort((a, b) => {
      let valA = a[contactSortField] || '';
      let valB = b[contactSortField] || '';
      valA = typeof valA === 'string' ? valA.toLowerCase() : valA;
      valB = typeof valB === 'string' ? valB.toLowerCase() : valB;
      if (valA < valB) return contactSortAsc ? -1 : 1;
      if (valA > valB) return contactSortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }
  const { id } = useParams();
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [futureSessions, setFutureSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);


  useEffect(() => {
    async function fetchDetails() {
      const resp = await authFetch(`/api/organizations/${id}/details/`);
      if (resp.ok) {
        const data = await resp.json();
        setOrganization(data);
        setCurrentSession(data.current_session);
        setFutureSessions(data.future_sessions);
        setPastSessions(data.past_sessions);
        setActivities(data.current_activities);
      }
    }
    fetchDetails();
  }, [id, deleting]);

  async function handleSoftDelete() {
    if (!window.confirm("Are you sure you want to deactivate this organization? This will hide it and all its contacts/sessions/classes from the system.")) return;
    setDeleting(true);
    setDeleteError(null);
    const resp = await authFetch(`/api/organizations/${id}/soft_delete/`, { method: "DELETE" });
    if (resp.status === 204) {
      navigate('/organization');
    } else {
      setDeleteError("Failed to deactivate organization.");
      setDeleting(false);
    }
  }

  if (!organization) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="d-flex align-items-center mb-3">
        <h2 className="mb-0 me-3" style={{ color: '#6a359c' }}>{organization.name}</h2>
        {organization.is_deleted ? (
          <div className="alert alert-warning mb-0">This organization is deactivated.</div>
        ) : (
          <button className="btn btn-danger" disabled={deleting} onClick={handleSoftDelete}>
            {deleting ? "Deactivating..." : "Deactivate Organization"}
          </button>
        )}
      </div>
      {deleteError && <div className="alert alert-danger">{deleteError}</div>}

      {/* Contacts Section */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Contacts</h4>
            <button
              className="btn btn-sm btn-success"
              onClick={() => navigate(`/contacts/new?organization=${organization.id}`)}
            >
              <i className="bi bi-plus-lg me-1"></i> New Contact
            </button>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{ width: '1%', textAlign: 'center' }}></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleContactSort('name')}>
                    Name{contactSortField === 'name' ? (contactSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleContactSort('role')}>
                    Role{contactSortField === 'role' ? (contactSortAsc ? ' ▲' : ' ▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedContacts().map(contact => (
                  <tr key={contact.id} className="reactive-contact-row">
                    <td style={{ width: '1%', textAlign: 'center' }}>
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
                    <td>
                      <Tooltip tooltip={`View details for ${contact.name}`}>
                        <a href={`/contacts/${contact.id}`}>{contact.name}</a>
                      </Tooltip>
                    </td>
                    <td>{contact.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Sessions Section */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Sessions</h4>
            <button className="btn btn-sm btn-light" onClick={() => setShowPastSessions(v => !v)}>
              {showPastSessions ? "Hide Past Sessions" : "Show Past Sessions"}
            </button>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Open sessions: future + current, sorted chronologically */}
                {[...(futureSessions || []), ...(currentSession ? [currentSession] : [])]
                  .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
                  .map(session => (
                    <Tooltip tooltip={`View session: ${session.name}`} key={session.id}>
                      <tr
                        className="clickable-row"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/sessions/${session.id}`)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/sessions/${session.id}`); }}
                      >
                        <td className="reactive-link-cell">
                          <span className="reactive-link-text">{session.name}</span>
                        </td>
                        <td>{formatDate(session.start_date)}</td>
                        <td>{formatDate(session.end_date)}</td>
                        <td>
                          {session.closed ? (
                            <span className="status-closed">Closed</span>
                          ) : (
                            <span className="status-open">Open</span>
                          )}
                        </td>
                      </tr>
                    </Tooltip>
                  ))}
                {/* Closed sessions: pastSessions, reverse chronological */}
                {showPastSessions && pastSessions && [...pastSessions]
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map(session => (
                    <tr key={session.id} className="clickable-row" onClick={() => window.location.href = `/sessions/${session.id}`}
                        tabIndex={0} style={{ cursor: 'pointer' }}>
                      <td className="reactive-link-cell">
                        <span className="reactive-link-text">{session.name}</span>
                      </td>
                      <td>{formatDate(session.start_date)}</td>
                      <td>{formatDate(session.end_date)}</td>
                      <td>
                        {session.closed ? (
                          <span className="status-closed">Closed</span>
                        ) : (
                          <span className="status-open">Open</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Classes in Current Session Section */}
      {currentSession && (
        <section className="mb-4">
          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0">Classes in Session: {currentSession.name}</h4>
            </div>
            <div className="card-body">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Day</th>
                    <th>Time</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activities].sort((a, b) => {
                    // Order by day_of_week, then time
                    const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
                    const dayA = days.indexOf(a.day_of_week);
                    const dayB = days.indexOf(b.day_of_week);
                    if (dayA !== dayB) return dayA - dayB;
                    // Compare time (assume format HH:MM AM/PM)
                    const parseTime = t => {
                      const [time, period] = t.split(' ');
                      let [h, m] = time.split(':').map(Number);
                      if (period === 'PM' && h !== 12) h += 12;
                      if (period === 'AM' && h === 12) h = 0;
                      return h * 60 + m;
                    };
                    return parseTime(a.time) - parseTime(b.time);
                  }).map(activity => (
                    <Tooltip tooltip={`View class: ${activity.type}`} key={activity.id}>
                      <tr
                        className="clickable-row"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/classes/details/${activity.id}`)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/classes/details/${activity.id}`); }}
                      >
                        <td>
                          <span className="reactive-link-text">{activity.type}</span>
                        </td>
                        <td><DayOfWeekDisplay activeDay={activity.day_of_week} /></td>
                        <td>{activity.time}</td>
                        <td>{activity.location}</td>
                      </tr>
                    </Tooltip>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default OrganizationDetails;
