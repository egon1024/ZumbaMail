import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { formatDate } from "../utils/formatDate";
import '../organization/OrganizationDetails.css';
import DayOfWeekDisplay from "../utils/DayOfWeekDisplay";
import Tooltip from "../utils/Tooltip";

function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    async function fetchDetails() {
      try {
        const resp = await authFetch(`/api/sessions/${id}/`);
        if (!resp.ok) throw new Error("Failed to fetch session details");
        const data = await resp.json();
        setSession(data.session);
        setOrganization(data.organization);
        setClasses(data.classes || []);
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!session) return <div>No session found.</div>;

  return (
    <div className="container mt-4">
      {/* Session Details Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Session Details</h4>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <tbody>
                <tr><th>Name</th><td>{session.name}</td></tr>
                <tr><th>Start Date</th><td>{formatDate(session.start_date)}</td></tr>
                <tr><th>End Date</th><td>{formatDate(session.end_date)}</td></tr>
                <tr><th>Status</th><td>{session.closed ? <span className="status-closed">Closed</span> : <span className="status-open">Open</span>}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Organization Card */}
      {organization && (
        <section className="mb-4">
          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-dark text-white">
              <h4 className="mb-0">Organization</h4>
            </div>
            <div className="card-body">
              <table className="table table-sm mb-0">
                <tbody>
                  <Tooltip tooltip={`View organization: ${organization.name}`}>
                    <tr
                      className="clickable-row"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/organization/${organization.id}`)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/organization/${organization.id}`); }}
                    >
                      <th>Name</th>
                      <td>
                        <span className="reactive-link-text">{organization.name}</span>
                      </td>
                    </tr>
                  </Tooltip>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Classes Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Classes</h4>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Location</th>
                  <th>Students</th>
                  <th>Waitlist</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <Tooltip tooltip={`View class: ${cls.type}`} key={cls.id}>
                    <tr
                      className="clickable-row"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/classes/${cls.id}`)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/classes/${cls.id}`); }}
                    >
                      <td><span className="reactive-link-text">{cls.type}</span></td>
                      <td><DayOfWeekDisplay activeDay={cls.day_of_week} /></td>
                      <td>{cls.time}</td>
                      <td>{cls.location}</td>
                      <td>{cls.num_students ?? ''}</td>
                      <td>{cls.num_waitlist ?? ''}</td>
                    </tr>
                  </Tooltip>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default SessionDetails;
