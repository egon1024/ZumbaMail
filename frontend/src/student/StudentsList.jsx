import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./StudentsList.css";
import Tooltip from "../utils/Tooltip";

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const resp = await authFetch("/api/students/?status=active");
        if (!resp.ok) throw new Error("Failed to fetch students");
        const data = await resp.json();
        setStudents(Array.isArray(data) ? data : data.students || []);
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  return (
    <div className="container mt-4">
      <h2 style={{ color: "#6a359c" }}>Active Students</h2>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}
      {!error && (
        <div className="table-responsive">
          <table className="table table-sm mb-0">
            <thead>
              <tr>
                <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center' }}>
                  Rochester<br />Resident
                </th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id} className="reactive-student-row">
                  <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                    <Tooltip text={`View details for ${student.first_name} ${student.last_name}`}>
                      <a
                        href={`/students/${student.id}`}
                        className="reactive-student-link"
                      >
                        {student.first_name} {student.last_name}
                      </a>
                    </Tooltip>
                    {student.active === false && (
                      <span className="badge bg-danger ms-2">Inactive</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', width: '1%' }}>
                    {student.rochester ? (
                      <Tooltip text="Rochester Resident">
                        <span style={{ color: 'green', fontSize: '1.2em' }}>&#10003;</span>
                      </Tooltip>
                    ) : (
                      <Tooltip text="Not a Rochester Resident">
                        <span style={{ color: 'red', fontSize: '1.2em' }}>&#10007;</span>
                      </Tooltip>
                    )}
                  </td>
                  <td>
                    {student.email ? (
                      <Tooltip text={`Email ${student.first_name} ${student.last_name}`}>
                        <a
                          href={`mailto:${student.email}`}
                          className="reactive-student-contact-link"
                        >
                          {student.email}
                        </a>
                      </Tooltip>
                    ) : <span className="text-muted">—</span>}
                  </td>
                  <td>
                    {student.phone ? (
                      <Tooltip text={`Call ${student.first_name} ${student.last_name}`}>
                        <a
                          href={`tel:${student.phone}`}
                          className="reactive-student-contact-link"
                        >
                          {student.phone}
                        </a>
                      </Tooltip>
                    ) : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentsList;
