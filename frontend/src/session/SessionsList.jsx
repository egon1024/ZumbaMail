import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { Link } from "react-router-dom";
import Tooltip from "../utils/Tooltip";
import { formatDate } from "../utils/formatDate";

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

  if (loading) {
    return <div className="container mt-4"><div>Loading sessions...</div></div>;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Sessions</h4>
          <div className="d-flex align-items-center">
            <button className="btn btn-light me-2" onClick={() => setShowClosed(v => !v)}>
              {showClosed ? "Hide Closed Sessions" : "Show Closed Sessions"}
            </button>
            <button
              className="btn btn-sm btn-success"
              onClick={() => window.location.href = '/sessions/new'}
              title="Create new session"
            >
              <i className="bi bi-plus-lg"></i> New Session
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {!error && (
            getSortedSessions().length === 0 ? (
              <div className="text-center text-muted py-4">No sessions found.</div>
            ) : (
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
                    <tr key={session.id} className="table-row-hover"
                      style={{ cursor: 'pointer' }}
                      onClick={e => {
                        if (e.target.closest('.edit-icon-link')) return;
                        window.location.href = `/sessions/${session.id}`;
                      }}
                      onMouseOver={e => {
                        // Only activate hover if NOT over the edit column
                        if (e.target.closest('td') && e.target.closest('td').classList.contains('edit-col')) {
                          e.currentTarget.classList.remove('row-hover-active');
                        } else {
                          e.currentTarget.classList.add('row-hover-active');
                        }
                      }}
                      onMouseOut={e => {
                        e.currentTarget.classList.remove('row-hover-active');
                      }}
                    >
                      <td className="edit-col" style={{ width: 'fit-content', textAlign: 'center', padding: '0 6px' }}>
                        <Tooltip tooltip="Edit session">
                          <Link to={`/sessions/${session.id}/edit`} className="edit-icon-link">
                            <i className="bi bi-pencil-square"></i>
                          </Link>
                        </Tooltip>
                      </td>
                      <td className="session-name-cell">
                        <Tooltip tooltip={`View details for ${session.name}`}>
                          <Link to={`/sessions/${session.id}`}>{session.name}</Link>
                        </Tooltip>
                      </td>
                      <td>{formatDate(session.start_date)}</td>
                      <td>{formatDate(session.end_date)}</td>
                      <td>
                        {session.closed ? (
                          <Tooltip tooltip="Session is closed">
                            <span style={{ color: '#b30000', fontWeight: 600 }}>Closed</span>
                          </Tooltip>
                        ) : (
                          <Tooltip tooltip="Session is open">
                            <span style={{ color: '#176a3a', fontWeight: 600 }}>Open</span>
                          </Tooltip>
                        )}
                      </td>
                      <td>
                        <Tooltip tooltip={`View organization: ${session.organization_name || session.organization}`}>
                          <span>{session.organization_name || session.organization}</span>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default SessionsList;

/* Add to the bottom of the file or your main CSS */
/* Responsive row hover behavior */
/* Only the .session-name-cell link turns blue on row hover */

/* If using CSS-in-JS, move to your main CSS file */

/* Example CSS: */
/*
.table-row-hover:hover .session-name-cell a {
  color: #176a3a !important;
  text-decoration: underline;
}
*/
