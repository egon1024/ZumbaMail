import React, { useEffect, useState } from 'react';
import OrganizationLink from '../organization/OrganizationLink';
import SessionLink from '../organization/SessionLink';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import DayOfWeekDisplay from '../utils/DayOfWeekDisplay';
import { formatTime } from '../utils/formatTime';
import './ClassDetail.css';

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    authFetch(`/api/activity/${id}/`)
      .then(resp => resp.json())
      .then(data => {
        setCls(data);
        setStudents(data.students || []);
        setWaitlist(data.waitlist || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load class details');
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading class details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!cls) return null;

  // Sort students and waitlist by display_name
  const sortedStudents = [...students].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));
  const sortedWaitlist = [...waitlist].sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Class Details</h4>
        </div>
        <div className="card-body">
          <table className="table table-bordered w-100">
            <tbody>
              <tr>
                <th>Organization</th>
                <td><OrganizationLink organization={{ id: cls.organization_id, name: cls.organization_name }} /></td>
              </tr>
              <tr>
                <th>Session</th>
                <td><SessionLink session={{ id: cls.session_id, name: cls.session_name }} /></td>
              </tr>
              <tr>
                <th>Type</th>
                <td>{cls.type}</td>
              </tr>
              <tr>
                <th>Day</th>
                <td><DayOfWeekDisplay activeDay={cls.day_of_week} /></td>
              </tr>
              <tr>
                <th>Time</th>
                <td>{formatTime(cls.time)}</td>
              </tr>
              <tr>
                <th>Location</th>
                <td>{cls.location}</td>
              </tr>
              <tr>
                <th>Students</th>
                <td>{cls.students_count}</td>
              </tr>
              <tr>
                <th>Waitlist</th>
                <td>{cls.waitlist_count}</td>
              </tr>
              <tr>
                <th>Status</th>
                <td>{cls.is_open ? <span className="text-success">Open</span> : <span className="text-danger">Closed</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Enrollment</h5>
          <button className="btn btn-outline-light btn-sm" type="button" onClick={() => navigate(`/classes/${id}/enrollment`)}>
            <i className="bi bi-pencil-square me-1"></i>
            Edit Enrollment
          </button>
        </div>
        <div className="card-body">
          <table className="table w-100">
            <thead>
              <tr className="enrollment-header-row">
                <th>Students</th>
                <th>Waitlist</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="align-top">
                  <ul className="list-unstyled">
                    {sortedStudents.length === 0 && <li>No students enrolled.</li>}
                    {sortedStudents.map(s => (
                      <li key={s.id}>
                        <Link to={`/students/${s.id}`} className="student-link">
                          {s.display_name || s.full_name || s.name || s.email || s.id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="align-top">
                  <ul className="list-unstyled">
                    {sortedWaitlist.length === 0 && <li>No one on waitlist.</li>}
                    {sortedWaitlist.map(s => (
                      <li key={s.id}>
                        <Link to={`/students/${s.id}`} className="student-link">
                          {s.display_name || s.full_name || s.name || s.email || s.id}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClassDetail;
