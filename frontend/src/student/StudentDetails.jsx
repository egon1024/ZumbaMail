import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Tooltip from "../utils/Tooltip";
import DayOfWeek from "../utils/DayOfWeek";
import PhoneDisplay from "../utils/phone/PhoneDisplay";
import { formatDate } from "../utils/formatDate";
import { authFetch } from "../utils/authFetch";
import "./StudentsList.css";

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [currentClasses, setCurrentClasses] = useState([]);
  const [waitlistClasses, setWaitlistClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const url = `/api/students/${id}/` + (showClosed ? '?include_closed=true' : '');
        const resp = await authFetch(url);
        if (!resp.ok) throw new Error("Failed to fetch student details");
        const data = await resp.json();
        setStudent(data);
        setCurrentClasses(data.current_classes || []);
        setWaitlistClasses(data.waitlist_classes || []);
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, showClosed]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!student) return <div>No student found.</div>;

  return (
    <div className="container mt-4">
      {/* Student Details Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Student Details</h4>
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => navigate('/students/new')}
                title="Create New Student"
              >
                <i className="bi bi-plus-lg"></i> New Student
              </button>
              <button
                className="btn btn-sm btn-outline-light"
                onClick={() => navigate(`/students/${id}/edit`)}
                title="Edit Student"
              >
                <i className="bi bi-pencil-square"></i> Edit
              </button>
            </div>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <tbody>
                <tr><th>Name</th><td>{student.display_name}</td></tr>
                <tr>
                  <th>Status</th>
                  <td>
                    {student.active ? (
                      <span className="text-success" title="Active">&#10003;</span>
                    ) : (
                      <span className="text-danger" title="Inactive">&#10007;</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Rochester Resident</th>
                  <td>
                    {student.rochester ? (
                      <span className="text-success" title="Rochester Resident">&#10003;</span>
                    ) : (
                      <span className="text-danger" title="Not a Rochester Resident">&#10007;</span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th>Facebook Profile</th>
                  <td>
                    {student.facebook_profile ? (
                      <a href={student.facebook_profile} target="_blank" rel="noopener noreferrer">{student.facebook_profile}</a>
                    ) : <span className="text-muted">—</span>}
                  </td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>
                    {student.email ? (
                      <Tooltip tooltip={`Email ${student.first_name} ${student.last_name}`}>
                        <a
                          href={`mailto:${student.email}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reactive-student-contact-link"
                        >
                          {student.email}
                        </a>
                      </Tooltip>
                    ) : <span className="text-muted">—</span>}
                  </td>
                </tr>
                <tr>
                  <th>Phone</th>
                  <td>
                    {student.phone ? (
                      <PhoneDisplay
                        value={student.phone}
                        className="reactive-student-contact-link"
                        tooltip={`Call ${student.first_name} ${student.last_name}`}
                      />
                    ) : <span className="text-muted">—</span>}
                  </td>
                </tr>
                <tr>
                  <th>Emergency Contact Name</th>
                  <td>{student.emergency_contact_name ? student.emergency_contact_name : <span className="text-muted">—</span>}</td>
                </tr>
                <tr>
                  <th>Emergency Contact Phone</th>
                  <td>
                    {student.emergency_contact_phone ? (
                      <PhoneDisplay
                        value={student.emergency_contact_phone}
                        className="reactive-student-contact-link"
                        tooltip={`Call Emergency Contact`}
                      />
                    ) : <span className="text-muted">—</span>}
                  </td>
                </tr>
                <tr>
                  <th>Notes</th>
                  <td>{student.notes ? student.notes : <span className="text-muted">—</span>}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Toggle closed classes button */}
      <div className="mb-3 text-end">
        <button
          className="btn btn-outline-primary"
          onClick={() => setShowClosed(v => !v)}
        >
          {showClosed ? "Hide Closed Classes" : "Show Closed Classes"}
        </button>
      </div>

      {/* Enrolled Classes Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Enrolled Classes</h4>
          </div>
          <div className="card-body">
            {currentClasses.length === 0 ? (
              <div className="text-muted">No current classes.</div>
            ) : (
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
                  {currentClasses.map(cls => (
                    <Tooltip tooltip={`View class: ${cls.type}`} key={cls.id}>
                      <tr
                        className="clickable-row"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/classes/${cls.id}`)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/classes/${cls.id}`); }}
                      >
                        <td><span className="reactive-link-text">{cls.type}</span></td>
                        <td><DayOfWeek activeDay={cls.day_of_week} /></td>
                        <td>{cls.time}</td>
                        <td>{cls.location}</td>
                      </tr>
                    </Tooltip>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Waitlist Classes Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Waitlist Classes</h4>
          </div>
          <div className="card-body">
            {waitlistClasses.length === 0 ? (
              <div className="text-muted">No waitlist classes.</div>
            ) : (
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
                  {waitlistClasses.map(cls => (
                    <Tooltip tooltip={`View class: ${cls.type}`} key={cls.id}>
                      <tr
                        className="clickable-row"
                        tabIndex={0}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/classes/${cls.id}`)}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') navigate(`/classes/${cls.id}`); }}
                      >
                        <td><span className="reactive-link-text">{cls.type}</span></td>
                        <td><DayOfWeek activeDay={cls.day_of_week} /></td>
                        <td>{cls.time}</td>
                        <td>{cls.location}</td>
                      </tr>
                    </Tooltip>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default StudentDetails;
