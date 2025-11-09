import { useState, useEffect, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authFetch } from "../utils/authFetch";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";
import DayOfWeek, { getDayTimeSortValue } from "../utils/DayOfWeek";

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

export default function CancellationList() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date());
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortField, setSortField] = useState('date');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal state for creating new cancellation
  const [showModal, setShowModal] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [cancellationReason, setCancellationReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Load organizations and sessions on mount
  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      authFetch("/api/organizations/").then(res => res.json()),
      authFetch("/api/sessions/").then(res => res.json()),
      authFetch("/api/classes/").then(res => res.json())
    ])
      .then(([orgsData, sessionsData, activitiesData]) => {
        setOrganizations(Array.isArray(orgsData) ? orgsData : orgsData.organizations || []);
        setSessions(Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : activitiesData.activities || []);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load data");
        setLoading(false);
      });
  }, []);

  // Load cancellations when date or organization changes
  useEffect(() => {
    // Calculate date range: +/- 30 days from selected date
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 30);

    const year1 = startDate.getFullYear();
    const month1 = String(startDate.getMonth() + 1).padStart(2, '0');
    const day1 = String(startDate.getDate()).padStart(2, '0');
    const startDateString = `${year1}-${month1}-${day1}`;

    const year2 = endDate.getFullYear();
    const month2 = String(endDate.getMonth() + 1).padStart(2, '0');
    const day2 = String(endDate.getDate()).padStart(2, '0');
    const endDateString = `${year2}-${month2}-${day2}`;

    let url = `/api/cancellations/?start_date=${startDateString}&end_date=${endDateString}`;
    if (selectedOrganization) {
      url += `&organization_id=${selectedOrganization}`;
    }

    authFetch(url)
      .then(res => {
        if (!res.ok) {
          throw new Error('Failed to fetch cancellations');
        }
        return res.json();
      })
      .then(data => {
        setCancellations(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error('Cancellations error:', err);
        setError("Failed to load cancellations");
        setCancellations([]);
      });
  }, [date, selectedOrganization]);

  // Sorting logic for cancellations
  function getSortedCancellations() {
    return [...cancellations].sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'date':
          valA = a.date || '';
          valB = b.date || '';
          break;
        case 'class':
          valA = a.activity_type || '';
          valB = b.activity_type || '';
          break;
        case 'org_session':
          valA = `${a.organization_name || ''} / ${a.session_name || ''}`;
          valB = `${b.organization_name || ''} / ${b.session_name || ''}`;
          break;
        case 'day_time':
          valA = getDayTimeSortValue(a.activity_day, a.activity_time);
          valB = getDayTimeSortValue(b.activity_day, b.activity_time);
          break;
        case 'location':
          valA = a.activity_location || '';
          valB = b.activity_location || '';
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

  async function handleCreateCancellation(e) {
    e.preventDefault();

    if (selectedActivities.length === 0) {
      setError("Please select at least one class to cancel");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // Format the selected date as YYYY-MM-DD
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      // Create cancellations for each selected activity
      const promises = selectedActivities.map(activityId =>
        authFetch('/api/cancellations/create/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity: activityId,
            date: dateString,
            reason: cancellationReason
          }),
        })
      );

      const responses = await Promise.all(promises);

      // Check if any failed
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        const errorData = await failedResponses[0].json();
        throw new Error(errorData.detail || 'Failed to create one or more cancellations');
      }

      // Refresh the cancellations list
      const startDate = new Date(date);
      startDate.setDate(startDate.getDate() - 30);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 30);

      const year1 = startDate.getFullYear();
      const month1 = String(startDate.getMonth() + 1).padStart(2, '0');
      const day1 = String(startDate.getDate()).padStart(2, '0');
      const startDateString = `${year1}-${month1}-${day1}`;

      const year2 = endDate.getFullYear();
      const month2 = String(endDate.getMonth() + 1).padStart(2, '0');
      const day2 = String(endDate.getDate()).padStart(2, '0');
      const endDateString = `${year2}-${month2}-${day2}`;

      let url = `/api/cancellations/?start_date=${startDateString}&end_date=${endDateString}`;
      if (selectedOrganization) {
        url += `&organization_id=${selectedOrganization}`;
      }

      const refreshResp = await authFetch(url);
      const data = await refreshResp.json();
      setCancellations(Array.isArray(data) ? data : []);

      // Reset form and close modal
      setSelectedActivities([]);
      setCancellationReason('');
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCancellation(id) {
    if (!confirm('Are you sure you want to un-cancel this class?')) {
      return;
    }

    try {
      const resp = await authFetch(`/api/cancellations/${id}/delete/`, {
        method: 'DELETE',
      });

      if (!resp.ok) {
        throw new Error('Failed to delete cancellation');
      }

      // Remove from local state
      setCancellations(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  // Get day of week from selected date
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedDayOfWeek = dayNames[date.getDay()];

  // Filter activities: by selected day of week and optionally by organization
  const activitiesForSelectedDay = activities.filter(activity => {
    const matchesDay = activity.day_of_week === selectedDayOfWeek;
    const matchesOrg = !selectedOrganization || activity.organization_id === parseInt(selectedOrganization);
    return matchesDay && matchesOrg;
  });

  // Handle checkbox toggle for activity selection
  function toggleActivitySelection(activityId) {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  }

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Class Cancellations</h4>
          <button
            className="btn btn-sm btn-success"
            onClick={() => setShowModal(true)}
          >
            + New Cancellation
          </button>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label d-block mb-3">Date</label>
            <DatePicker
              selected={date}
              onChange={setDate}
              inline
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

      {loading ? (
        <div>Loading cancellations...</div>
      ) : cancellations.length === 0 ? (
        <div className="alert alert-info">No cancelled classes found within 30 days of {formatDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)}</div>
      ) : (
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Cancelled Classes (within 30 days of {formatDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)})</h5>
          </div>
          <div className="card-body">
            <table className="table table-sm mb-0">
              <thead>
                <tr>
                  <th style={{cursor:'pointer'}} onClick={() => { setSortField('date'); setSortAsc(sortField === 'date' ? !sortAsc : true); }}>
                    Date {sortField === 'date' && (sortAsc ? '▲' : '▼')}
                  </th>
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
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedCancellations().map(cancellation => (
                  <tr key={cancellation.id}>
                    <td>{formatDate(cancellation.date)}</td>
                    <td>{cancellation.activity_type}</td>
                    <td>{cancellation.organization_name} / {cancellation.session_name}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <DayOfWeek activeDay={cancellation.activity_day} />
                        <span>{formatTime(cancellation.activity_time)}</span>
                      </div>
                    </td>
                    <td>{cancellation.activity_location}</td>
                    <td>{cancellation.reason || <em className="text-muted">No reason provided</em>}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCancellation(cancellation.id)}
                      >
                        Un-cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for creating new cancellation */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cancel Classes on {formatDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedActivities([]);
                    setCancellationReason('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleCreateCancellation}>
                <div className="modal-body">
                  {activitiesForSelectedDay.length === 0 ? (
                    <div className="alert alert-info">
                      No classes are scheduled for {selectedDayOfWeek}, {formatDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`)}
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Select classes to cancel *</label>
                        <div className="border rounded p-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                          {activitiesForSelectedDay.map(activity => (
                            <div key={activity.id} className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`activity-${activity.id}`}
                                checked={selectedActivities.includes(activity.id)}
                                onChange={() => toggleActivitySelection(activity.id)}
                              />
                              <label className="form-check-label" htmlFor={`activity-${activity.id}`}>
                                <strong>{activity.type}</strong> - {formatTime(activity.time)} at {activity.location}
                                <div className="small text-muted">
                                  {activity.organization_name} / {activity.session_name}
                                </div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Reason (optional)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={cancellationReason}
                          onChange={e => setCancellationReason(e.target.value)}
                          placeholder="e.g., Holiday, Instructor unavailable"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowModal(false);
                      setSelectedActivities([]);
                      setCancellationReason('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || activitiesForSelectedDay.length === 0}
                  >
                    {saving ? 'Saving...' : `Cancel ${selectedActivities.length} Class${selectedActivities.length !== 1 ? 'es' : ''}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
