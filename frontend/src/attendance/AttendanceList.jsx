import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authFetch } from "../utils/authFetch";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";
import DayOfWeekDisplay from "../utils/DayOfWeekDisplay";

// Custom input that uses formatDate for display
const FormattedDateInput = forwardRef(({ value, onClick, selectedDate }, ref) => {
  const displayValue = selectedDate ? formatDate(selectedDate.toISOString().split('T')[0]) : '';

  return (
    <input
      type="text"
      className="form-control"
      value={displayValue}
      onClick={onClick}
      ref={ref}
      readOnly
    />
  );
});

FormattedDateInput.displayName = 'FormattedDateInput';

export default function AttendanceList() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [sessions, setSessions] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState("");
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);
  const [sortField, setSortField] = useState('class');
  const [sortAsc, setSortAsc] = useState(true);

  // Load organizations and sessions on mount
  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      authFetch("/api/organizations/").then(res => res.json()),
      authFetch("/api/sessions/").then(res => res.json())
    ])
      .then(([orgsData, sessionsData]) => {
        setOrganizations(Array.isArray(orgsData) ? orgsData : orgsData.organizations || []);
        const sessionsList = Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [];
        setSessions(sessionsList);

        // Calculate min/max dates from open sessions
        const openSessions = sessionsList.filter(s => !s.closed);
        if (openSessions.length > 0) {
          const dates = openSessions.flatMap(s => [new Date(s.start_date), new Date(s.end_date)]);
          setMinDate(new Date(Math.min(...dates)));
          setMaxDate(new Date(Math.max(...dates)));
        }

        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  // Load attendance stats when date or organization changes
  useEffect(() => {
    // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    setStatsLoading(true);

    let url = `/api/attendance/stats/?date=${dateString}`;
    if (selectedOrganization) {
      url += `&organization_id=${selectedOrganization}`;
    }

    authFetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch attendance stats');
        }
        return res.json();
      })
      .then(data => {
        setAttendanceStats(Array.isArray(data) ? data : []);
        setStatsLoading(false);
      })
      .catch(err => {
        console.error('Attendance stats error:', err);
        setError("Failed to load attendance stats");
        setAttendanceStats([]);
        setStatsLoading(false);
      });
  }, [date, selectedOrganization]);

  function handleClassClick(classId) {
    // Format date as YYYY-MM-DD in local timezone (avoid UTC conversion)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    navigate(`/attendance/${classId}?date=${dateString}`);
  }

  // Sorting logic for attendanceStats
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  function getSortedStats() {
    return [...attendanceStats].sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'class':
          valA = a.type || '';
          valB = b.type || '';
          break;
        case 'org_session':
          valA = `${a.organization_name || ''} / ${a.session_name || ''}`;
          valB = `${b.organization_name || ''} / ${b.session_name || ''}`;
          break;
        case 'day_time':
          const parseTime = t => {
            if (!t) return 0;
            if (/AM|PM/.test(t)) {
              const [time, period] = t.split(' ');
              let [h, m] = time.split(':').map(Number);
              if (period === 'PM' && h !== 12) h += 12;
              if (period === 'AM' && h === 12) h = 0;
              return h * 60 + m;
            } else {
              let [h, m] = t.split(':').map(Number);
              return h * 60 + m;
            }
          };
          valA = days.indexOf(a.day_of_week) * 1440 + parseTime(a.time);
          valB = days.indexOf(b.day_of_week) * 1440 + parseTime(b.time);
          break;
        case 'location':
          valA = a.location || '';
          valB = b.location || '';
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

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Take Attendance</h4>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label d-block mb-3">Date</label>
            <DatePicker
              selected={date}
              onChange={setDate}
              inline
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>

          <div>
            <label htmlFor="organization" className="form-label">Organization (optional filter)</label>
            <select
              id="organization"
              className="form-select"
              value={selectedOrganization}
              onChange={e => setSelectedOrganization(e.target.value)}
            >
              <option value="">All Organizations</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {statsLoading ? (
        <div>Loading attendance data...</div>
      ) : attendanceStats.length === 0 ? (
        <div className="alert alert-info">No classes found for the selected date and organization.</div>
      ) : (
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Classes for {formatDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)}</h5>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{cursor:'pointer'}} onClick={() => { setSortField('class'); setSortAsc(sortField === 'class' ? !sortAsc : true); }}>
                    Class {sortField === 'class' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{cursor:'pointer'}} onClick={() => { setSortField('org_session'); setSortAsc(sortField === 'org_session' ? !sortAsc : true); }}>
                    Organization / Session {sortField === 'org_session' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{cursor:'pointer'}} onClick={() => { setSortField('day_time'); setSortAsc(sortField === 'day_time' ? !sortAsc : true); }}>
                    Day / Time {sortField === 'day_time' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th style={{cursor:'pointer'}} onClick={() => { setSortField('location'); setSortAsc(sortField === 'location' ? !sortAsc : true); }}>
                    Location {sortField === 'location' && (sortAsc ? '▲' : '▼')}
                  </th>
                  <th>Enrolled</th>
                  <th>Waitlist</th>
                  <th>Walk-ins</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {getSortedStats().map(stat => (
                  <tr
                    key={stat.id}
                    className="clickable-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleClassClick(stat.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleClassClick(stat.id); }}
                  >
                    <td>{stat.type}</td>
                    <td>{stat.organization_name} / {stat.session_name}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <DayOfWeekDisplay activeDay={stat.day_of_week} />
                        <span>{formatTime(stat.time)}</span>
                      </div>
                    </td>
                    <td>{stat.location}</td>
                    <td>
                      {stat.enrolled_present}/{stat.enrolled_count}
                      {stat.enrolled_absent > 0 && (
                        <span className="text-danger ms-1">({stat.enrolled_absent} absent)</span>
                      )}
                    </td>
                    <td>
                      {stat.waitlist_count > 0 ? (
                        <>
                          {stat.waitlist_present}/{stat.waitlist_count}
                          {stat.waitlist_absent > 0 && (
                            <span className="text-danger ms-1">({stat.waitlist_absent} absent)</span>
                          )}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {stat.walkin_count > 0 ? (
                        <span className="text-info">{stat.walkin_count}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {!stat.has_meeting && (
                        <span className="small" style={{ color: '#856404' }}>
                          <em>Not taken</em>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
