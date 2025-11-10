import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import Organization from '../organization/OrganizationLink';
import SessionLink from '../organization/SessionLink';
import DayOfWeek, { getDayIndex, parseTimeToMinutes, compareDayTime } from '../utils/DayOfWeek';
import { formatTime } from '../utils/formatTime';
import './ClassList.css';

const ClassList = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [sortField, setSortField] = useState('organization_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  useEffect(() => {
    setLoading(true);
    const url = showInactive ? '/api/classes/?include_inactive=true' : '/api/classes/';
    authFetch(url)
      .then(resp => resp.json())
      .then(data => {
        // Default sort: Organization, Day, Time
        data.sort((a, b) => {
          if (a.organization_name !== b.organization_name) return a.organization_name.localeCompare(b.organization_name);
          return compareDayTime(a.day_of_week, a.time, b.day_of_week, b.time);
        });
        setClasses(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load classes');
        setLoading(false);
      });
  }, [showInactive]);

  function handleSort(field) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function getSortedClasses() {
    return [...classes].sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'organization_name':
          valA = a.organization_name || '';
          valB = b.organization_name || '';
          break;
        case 'day_of_week':
          valA = getDayIndex(a.day_of_week);
          valB = getDayIndex(b.day_of_week);
          break;
        case 'time':
          valA = parseTimeToMinutes(a.time);
          valB = parseTimeToMinutes(b.time);
          break;
        case 'session_name':
          valA = a.session_name || '';
          valB = b.session_name || '';
          break;
        case 'type':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'closed':
          valA = a.closed ? 1 : 0;
          valB = b.closed ? 1 : 0;
          break;
        default:
          valA = a[sortField] || '';
          valB = b[sortField] || '';
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }

  if (loading) return <div>Loading classes...</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Classes</h4>
          <div>
            <button
              className="btn btn-sm btn-success me-2"
              onClick={() => window.location.href = '/classes/new'}
              title="Create new class"
            >
              <i className="bi bi-plus-lg"></i> New Class
            </button>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => setShowInactive(v => !v)}
            >
              {showInactive ? 'Show Active Only' : 'Show All Classes'}
            </button>
          </div>
        </div>
        <div className="card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {!error && classes.length === 0 && (
            <div className="p-3">No classes found.</div>
          )}
          {!error && classes.length > 0 && (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 'fit-content', textAlign: 'center', padding: 0 }}></th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('type')}>Type</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('day_of_week')}>Day</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('time')}>Time</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('location')}>Location</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('session_name')}>Session</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('organization_name')}>Organization</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('students_count')}>Students</th>
                    <th style={{cursor:'pointer'}} onClick={() => handleSort('waitlist_count')}>Waitlist</th>
                    {showInactive && <th style={{cursor:'pointer'}} onClick={() => handleSort('closed')}>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {getSortedClasses().map((cls, idx) => {
                    const detailUrl = `/classes/${cls.id}`;
                    const editUrl = `/classes/${cls.id}/edit`;
                    const enrollmentUrl = `/classes/${cls.id}/enrollment`;
                    return (
                      <tr key={cls.id} className={`class-row${hoveredIdx === idx ? ' hovered' : ''}`} tabIndex={0}>
                        <td style={{ width: 'fit-content', textAlign: 'center', padding: '0 10px' }}>
                          <a
                            href={enrollmentUrl}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '4px 6px',
                              marginRight: '8px',
                              outline: 'none',
                              boxShadow: 'none',
                              display: 'inline-block'
                            }}
                            tabIndex={0}
                            title="Manage Enrollment"
                          >
                            <i className="bi bi-person-plus-fill" style={{ fontSize: '1.2em', color: '#0d6efd', verticalAlign: 'middle' }}></i>
                          </a>
                          <a
                            href={editUrl}
                            style={{
                              border: 'none',
                              background: 'none',
                              padding: '4px 6px',
                              outline: 'none',
                              boxShadow: 'none',
                              display: 'inline-block'
                            }}
                            tabIndex={0}
                            title="Edit Class"
                          >
                            <i className="bi bi-pencil-square" style={{ fontSize: '1.2em', color: '#6a359c', verticalAlign: 'middle' }}></i>
                          </a>
                        </td>
                        {/* First column: highlight if hoveredIdx matches and not session/org */}
                        <td
                          className={`class-label${hoveredIdx === idx ? ' hovered' : ''}`}
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          {cls.type}
                        </td>
                        {/* Day */}
                        <td
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          <DayOfWeek activeDay={cls.day_of_week} />
                        </td>
                        {/* Time */}
                        <td
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          {formatTime(cls.time)}
                        </td>
                        {/* Location */}
                        <td
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          {cls.location}
                        </td>
                        {/* Session: only link, no hover effect */}
                        <td>
                          <SessionLink session={{ id: cls.session_id, name: cls.session_name }} />
                        </td>
                        {/* Organization: only link, no hover effect */}
                        <td>
                          <Organization organization={{ id: cls.organization_id, name: cls.organization_name }} />
                        </td>
                        {/* Students */}
                        <td
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          {cls.students_count}
                        </td>
                        {/* Waitlist */}
                        <td
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          onClick={() => window.location.href = detailUrl}
                          style={{cursor: 'pointer'}}
                        >
                          {cls.waitlist_count}
                        </td>
                        {/* Status - only show when showInactive is true */}
                        {showInactive && (
                          <td
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            onClick={() => window.location.href = detailUrl}
                            style={{cursor: 'pointer'}}
                          >
                            {!cls.closed ? <span className="text-success">Open</span> : <span className="text-danger">Closed</span>}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassList;
