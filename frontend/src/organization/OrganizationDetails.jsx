import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Organization from "./OrganizationLink";
import ContactLink from "./ContactLink";
import { authFetch } from "../utils/authFetch";
import SessionLink from "./SessionLink";
import './OrganizationDetails.css';

function OrganizationDetails() {
  const { id } = useParams();
  const [organization, setOrganization] = useState(null);
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [futureSessions, setFutureSessions] = useState([]);
  const [pastSessions, setPastSessions] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Fetch organization details (contacts, sessions, activities)
    async function fetchDetails() {
      const resp = await authFetch(`/api/organizations/${id}/details/`);
      if (resp.ok) {
        const data = await resp.json();
        setOrganization(data.organization);
        setCurrentSession(data.current_session);
        setFutureSessions(data.future_sessions);
        setPastSessions(data.past_sessions);
        setActivities(data.current_activities);
      }
    }
    fetchDetails();
  }, [id]);

  if (!organization) return <div>Loading...</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: "#6a359c" }}>{organization.name}</h2>

      {/* Contacts Section */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Contacts</h4>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {organization.contacts.map(contact => (
                  <tr key={contact.id}>
                    <td><ContactLink contact={contact} /></td>
                    <td>{contact.role}</td>
                    <td>{contact.email ? (
                      <a href={`mailto:${contact.email}`}>{contact.email}</a>
                    ) : ''}</td>
                    <td>{contact.phone ? (
                      <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                    ) : ''}</td>
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
                    <tr key={session.id} className="clickable-row" onClick={() => window.location.href = `/sessions/details/${session.id}`}
                        tabIndex={0} style={{ cursor: 'pointer' }}>
                      <td className="reactive-link-cell">
                        <span className="reactive-link-text">{session.name}</span>
                      </td>
                      <td>{session.start_date}</td>
                      <td>{session.end_date}</td>
                      <td>
                        {session.closed ? (
                          <span className="status-closed">Closed</span>
                        ) : (
                          <span className="status-open">Open</span>
                        )}
                      </td>
                    </tr>
                  ))}
                {/* Closed sessions: pastSessions, reverse chronological */}
                {showPastSessions && pastSessions && [...pastSessions]
                  .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
                  .map(session => (
                    <tr key={session.id} className="clickable-row" onClick={() => window.location.href = `/sessions/details/${session.id}`}
                        tabIndex={0} style={{ cursor: 'pointer' }}>
                      <td className="reactive-link-cell">
                        <span className="reactive-link-text">{session.name}</span>
                      </td>
                      <td>{session.start_date}</td>
                      <td>{session.end_date}</td>
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
                    <tr key={activity.id} className="clickable-row" tabIndex={0} style={{ cursor: 'pointer' }}
                        onClick={() => window.location.href = `/classes/details/${activity.id}`}>
                      <td>{activity.type}</td>
                      <td>{activity.day_of_week}</td>
                      <td>{activity.time}</td>
                      <td>{activity.location}</td>
                    </tr>
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
