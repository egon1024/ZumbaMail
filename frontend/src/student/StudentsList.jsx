import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import "./StudentsList.css";
import Tooltip from "../utils/Tooltip";

function StudentsList() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      try {
        let resp;
        if (showInactive) {
          // Get both active and inactive students
          resp = await authFetch("/api/students/?status=all");
        } else {
          resp = await authFetch("/api/students/?status=active");
        }
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
  }, [showInactive]);

  return (
    <div className="container mt-4">
      <div className="mb-3 text-end">
        <button
          className="btn btn-outline-primary"
          onClick={() => setShowInactive(v => !v)}
        >
          {showInactive ? "Show Only Active Students" : "Show Inactive Students"}
        </button>
      </div>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">{showInactive ? "All Students" : "Active Students"}</h4>
        </div>
        <div className="card-body">
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
                    <th style={{ width: '1%', whiteSpace: 'nowrap' }}></th>
                    <th style={{ width: '1%', whiteSpace: 'nowrap' }}>Name</th>
                    {showInactive && (
                      <th style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center' }}>Status</th>
                    )}
                    <th style={{ width: '1%', whiteSpace: 'nowrap', textAlign: 'center' }}>
                      Rochester<br />Resident
                    </th>
                    <th>Email</th>
                    <th>Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {students
                    .slice()
                    .sort((a, b) => {
                      const lastA = (a.last_name || '').toLowerCase();
                      const lastB = (b.last_name || '').toLowerCase();
                      if (lastA < lastB) return -1;
                      if (lastA > lastB) return 1;
                      const firstA = (a.first_name || '').toLowerCase();
                      const firstB = (b.first_name || '').toLowerCase();
                      if (firstA < firstB) return -1;
                      if (firstA > firstB) return 1;
                      return 0;
                    })
                    .map(student => (
                      <tr key={student.id} className="reactive-student-row">
                        <td style={{ width: '1%', textAlign: 'center' }}>
                          <Tooltip tooltip="Edit student">
                            <a
                              href={`/students/${student.id}/edit`}
                              style={{ border: 'none', background: 'none', padding: 0, outline: 'none', boxShadow: 'none' }}
                              tabIndex={0}
                            >
                              <i className="bi bi-pencil-square" style={{ fontSize: '1.2em', color: '#6a359c', verticalAlign: 'middle' }}></i>
                            </a>
                          </Tooltip>
                        </td>
                        <td style={{ whiteSpace: 'nowrap', width: '1%' }}>
                          <Tooltip tooltip={`View details for ${student.last_name}, ${student.first_name}`}>
                            <a
                              href={`/students/${student.id}`}
                              className="reactive-student-link"
                            >
                              {student.last_name}, {student.first_name}
                            </a>
                          </Tooltip>
                        </td>
                        {showInactive && (
                          <td style={{ textAlign: 'center', width: '1%' }}>
                            {student.active !== false ? (
                              <Tooltip tooltip="Active">
                                <span style={{ color: 'green', fontSize: '1.2em' }}>
                                  &#10003;
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip tooltip="Inactive">
                                <span style={{ color: 'red', fontSize: '1.2em' }}>
                                  &#10007;
                                </span>
                              </Tooltip>
                            )}
                          </td>
                        )}
                        <td style={{ textAlign: 'center', width: '1%' }}>
                          {student.rochester ? (
                            <Tooltip tooltip="Rochester Resident">
                              <span style={{ color: 'green', fontSize: '1.2em' }}>
                                &#10003;
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip tooltip="Not a Rochester Resident">
                              <span style={{ color: 'red', fontSize: '1.2em' }}>
                                &#10007;
                              </span>
                            </Tooltip>
                          )}
                        </td>
                        <td>
                          {student.email ? (
                            <Tooltip tooltip={`Email ${student.first_name} ${student.last_name}`}>
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
                            <Tooltip tooltip={`Call ${student.first_name} ${student.last_name}`}>
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
      </div>
    </div>
  );
}

export default StudentsList;
