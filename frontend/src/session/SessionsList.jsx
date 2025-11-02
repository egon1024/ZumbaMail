import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { Link } from "react-router-dom";

function SessionsList() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showClosed, setShowClosed] = useState(false);
  const [sortField, setSortField] = useState('default');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const resp = await authFetch("/api/sessions/");
        if (!resp.ok) throw new Error("Failed to fetch sessions");
        const data = await resp.json();
        setSessions(Array.isArray(data) ? data : data.sessions || []);
      } catch (err) {
        setError("Unable to connect to backend server. Please check that the backend is running.");
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  const filteredSessions = showClosed
    ? sessions
    : sessions.filter(session => !session.closed);

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function getSortedSessions() {
    let sorted = [...filteredSessions];
    if (sortField === 'default') {
      // Open first, then closed, then by start date
      sorted.sort((a, b) => {
        if (a.closed !== b.closed) return a.closed ? 1 : -1;
        return new Date(a.start_date) - new Date(b.start_date);
      });
    } else if (sortField === 'name') {
      sorted.sort((a, b) => {
        let valA = a.name.toLowerCase();
        let valB = b.name.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    } else if (sortField === 'start_date') {
      sorted.sort((a, b) => {
        let valA = new Date(a.start_date);
        let valB = new Date(b.start_date);
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    } else if (sortField === 'organization') {
      sorted.sort((a, b) => {
        let valA = (a.organization_name || '').toLowerCase();
        let valB = (b.organization_name || '').toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 style={{ color: "#6a359c" }}>Sessions</h2>
        <button className="btn btn-light" onClick={() => setShowClosed(v => !v)}>
          {showClosed ? "Hide Closed Sessions" : "Show Closed Sessions"}
        </button>
      </div>
      <div className="card mb-4" style={{ borderRadius: "18px", boxShadow: "0 2px 8px rgba(106,53,156,0.12)", background: "#f5f3ff", border: "none" }}>
        <div className="card-body p-4">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {!error && (
            <table className="table table-sm mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}></th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('name')}>
                    Name {sortField === 'name' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('start_date')}>
                    Start Date {sortField === 'start_date' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => handleSort('organization')}>
                    Organization {sortField === 'organization' ? (sortAsc ? '▲' : '▼') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getSortedSessions().map(session => (
                  <tr key={session.id}>
                    <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }}>
                      <Link to={`/sessions/edit/${session.id}`} className="edit-icon-link" title="Edit">
                        <i className="bi bi-pencil"></i>
                      </Link>
                    </td>
                    <td>
                      <Link to={`/sessions/${session.id}`}>{session.name}</Link>
                    </td>
                    <td>{session.start_date}</td>
                    <td>{session.end_date}</td>
                    <td>
                      {session.closed ? (
                        <span style={{ color: '#b30000', fontWeight: 600 }}>Closed</span>
                      ) : (
                        <span style={{ color: '#176a3a', fontWeight: 600 }}>Open</span>
                      )}
                    </td>
                    <td>{session.organization_name || session.organization}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionsList;
