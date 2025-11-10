import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';
import { formatTime } from '../utils/formatTime';
import { compareDayTime } from '../utils/DayOfWeek';
import './GenerateSignInSheet.css';

export default function GenerateSignInSheet() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedSheetUrl, setGeneratedSheetUrl] = useState('');
  const [generating, setGenerating] = useState(false);

  // Load sessions and activities on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch('/api/sessions/').then(res => res.json()),
      authFetch('/api/classes/').then(res => res.json())
    ])
      .then(([sessionsData, activitiesData]) => {
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load data');
        setLoading(false);
      });
  }, []);

  // When activity is selected, auto-populate start and end dates
  useEffect(() => {
    if (!selectedActivity) {
      setStartDate('');
      setEndDate('');
      return;
    }

    const activity = activities.find(a => a.id === parseInt(selectedActivity));
    if (!activity) return;

    // Find the session to get start and end dates
    const session = sessions.find(s => s.id === activity.session_id);
    if (session) {
      setStartDate(session.start_date || '');
      setEndDate(session.end_date || '');
    }
  }, [selectedActivity, activities, sessions]);

  // Calculate number of weeks from start and end dates
  const calculateNumWeeks = () => {
    if (!startDate || !endDate) return 7;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

    return Math.max(1, Math.min(52, diffWeeks));
  };

  async function handleGenerate(e) {
    e.preventDefault();

    if (!selectedActivity) {
      setError('Please select a class');
      return;
    }

    if (!startDate) {
      setError('Please select a start date');
      return;
    }

    if (!endDate) {
      setError('Please select an end date');
      return;
    }

    const numWeeks = calculateNumWeeks();

    setGenerating(true);
    setError('');
    setGeneratedSheetUrl('');

    try {
      const response = await authFetch('/api/signin-sheet/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: parseInt(selectedActivity),
          start_date: startDate,
          num_weeks: numWeeks
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate sign-in sheet');
      }

      setGeneratedSheetUrl(data.sheet_url);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Filter activities by selected session
  const filteredActivities = selectedSession
    ? activities.filter(a => a.session_id === parseInt(selectedSession))
    : [];

  // Group filtered activities by organization for dropdown headers
  const activitiesByOrg = filteredActivities.reduce((acc, activity) => {
    const key = activity.organization_name;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(activity);
    return acc;
  }, {});

  // Sort activities within each organization chronologically (by day and time)
  Object.keys(activitiesByOrg).forEach(orgName => {
    activitiesByOrg[orgName].sort((a, b) =>
      compareDayTime(a.day_of_week, a.time, b.day_of_week, b.time)
    );
  });

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Generate Sign-In Sheet</h4>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-danger">{error}</div>}

          {generatedSheetUrl && (
            <div className="alert alert-success">
              <h5 className="alert-heading">Sign-In Sheet Created!</h5>
              <p className="mb-2">Your sign-in sheet has been created in Google Sheets.</p>
              <a
                href={generatedSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm"
              >
                Open Sign-In Sheet
              </a>
            </div>
          )}

          <form onSubmit={handleGenerate}>
            <div className="mb-3">
              <label htmlFor="session" className="form-label">Session *</label>
              {loading ? (
                <div>Loading sessions...</div>
              ) : (
                <select
                  id="session"
                  className="form-select"
                  value={selectedSession}
                  onChange={e => {
                    setSelectedSession(e.target.value);
                    setSelectedActivity(''); // Reset activity when session changes
                  }}
                  required
                >
                  <option value="">Select a session...</option>
                  {sessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {session.organization_name} / {session.name}
                    </option>
                  ))}
                </select>
              )}
              <div className="form-text">
                First, select the session
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="activity" className="form-label">Class *</label>
              {!selectedSession ? (
                <div className="form-text text-muted">Select a session first</div>
              ) : filteredActivities.length === 0 ? (
                <div className="form-text text-muted">No classes found for this session</div>
              ) : (
                <select
                  id="activity"
                  className="form-select"
                  value={selectedActivity}
                  onChange={e => setSelectedActivity(e.target.value)}
                  required
                >
                  <option value="">Select a class...</option>
                  {Object.entries(activitiesByOrg).map(([orgName, acts]) => (
                    <optgroup key={orgName} label={orgName}>
                      {acts.map(activity => (
                        <option key={activity.id} value={activity.id}>
                          {activity.day_of_week} {activity.type} - {formatTime(activity.time)} at {activity.location}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              <div className="form-text">
                Select the class for which you want to generate a sign-in sheet
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="startDate" className="form-label">Start Date *</label>
                <input
                  type="date"
                  id="startDate"
                  className="form-control"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
                <div className="form-text">
                  The first date column in the sign-in sheet
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="endDate" className="form-label">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  className="form-control"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
                <div className="form-text">
                  The last date column in the sign-in sheet
                </div>
              </div>
            </div>

            {startDate && endDate && (
              <div className="alert alert-info mb-3">
                <small>
                  This will generate a sign-in sheet with <strong>{calculateNumWeeks()} weeks</strong> of date columns.
                </small>
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={generating || !selectedActivity}
              >
                {generating ? 'Generating...' : 'Generate Sign-In Sheet'}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/attendance')}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {selectedActivity && (
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">Preview</h5>
          </div>
          <div className="card-body">
            {(() => {
              const activity = activities.find(a => a.id === parseInt(selectedActivity));
              if (!activity) return null;

              return (
                <div>
                  <p className="mb-2">
                    <strong>Class:</strong> {activity.day_of_week} {activity.type}
                  </p>
                  <p className="mb-2">
                    <strong>Time:</strong> {formatTime(activity.time)} at {activity.location}
                  </p>
                  <p className="mb-2">
                    <strong>Organization/Session:</strong> {activity.organization_name} / {activity.session_name}
                  </p>
                  <p className="mb-2">
                    <strong>Enrolled Students:</strong> {activity.students_count}
                  </p>
                  <p className="mb-0">
                    <strong>Waitlist Students:</strong> {activity.waitlist_count}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
