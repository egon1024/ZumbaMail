import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Tooltip from "../utils/Tooltip";
import DayOfWeekDisplay from "../utils/DayOfWeekDisplay";
import { formatDate } from "../utils/formatDate";
import "./StudentsList.css";

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [currentClasses, setCurrentClasses] = useState([]);
  const [waitlistClasses, setWaitlistClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const resp = await fetch(`/api/students/${id}/details/`);
        if (!resp.ok) throw new Error("Failed to fetch student details");
        const data = await resp.json();
        setStudent(data.student);
        setCurrentClasses(data.current_classes || []);
        setWaitlistClasses(data.waitlist_classes || []);
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
  if (!student) return <div>No student found.</div>;

  return (
    <div className="container mt-4">
      {/* Student Details Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Student Details</h4>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <tbody>
                <tr><th>Name</th><td>{student.first_name} {student.last_name}</td></tr>
                <tr><th>Email</th><td>{student.email}</td></tr>
                <tr><th>Phone</th><td>{student.phone}</td></tr>
                <tr><th>Rochester Resident</th><td>{student.rochester ? "Yes" : "No"}</td></tr>
                <tr><th>Status</th><td>{student.active ? "Active" : "Inactive"}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Current Classes Card */}
      <section className="mb-4">
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Current Classes</h4>
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
                        <td><DayOfWeekDisplay activeDay={cls.day_of_week} /></td>
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
                        <td><DayOfWeekDisplay activeDay={cls.day_of_week} /></td>
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
