import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

function SessionEmailList() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [combinations, setCombinations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load organizations on mount and find default organization
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await authFetch('/api/organizations/');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);

        // Find organization with "Roch" in the name (case insensitive)
        const defaultOrg = data.find(org =>
          org.name.toLowerCase().includes('roch')
        );
        if (defaultOrg) {
          setSelectedOrgId(defaultOrg.id.toString());
        }
      } catch (err) {
        setError('Failed to load organizations');
      }
    }
    fetchOrganizations();
  }, []);

  // Load sessions when organization changes
  useEffect(() => {
    if (!selectedOrgId) {
      setSessions([]);
      setSelectedSessionId('');
      setCombinations(null);
      setError(null);
      return;
    }

    // Clear selected session when organization changes
    setSelectedSessionId('');
    setCombinations(null);
    setError(null);

    async function fetchSessions() {
      try {
        const response = await authFetch(`/api/sessions/?organization=${selectedOrgId}`);
        if (!response.ok) throw new Error('Failed to fetch sessions');
        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError('Failed to load sessions');
      }
    }
    fetchSessions();
  }, [selectedOrgId]);

  // Auto-load combinations when session changes
  useEffect(() => {
    if (!selectedOrgId || !selectedSessionId) {
      setCombinations(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const loadCombinations = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/communication/session-enrollments/?session_id=${selectedSessionId}`
        );

        if (isCancelled) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load enrollment combinations');
        }

        const data = await response.json();
        setCombinations(data);
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to load enrollment combinations');
          setCombinations(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadCombinations();

    return () => {
      isCancelled = true;
    };
  }, [selectedOrgId, selectedSessionId]);

  // Filter sessions based on showClosed checkbox
  const filteredSessions = sessions.filter(session =>
    showClosed || !session.closed
  );

  const formatClassList = (classes) => {
    if (classes.length === 0) return 'None';
    return classes.map(cls => `${cls.day_of_week} ${cls.type}`).join(', ');
  };

  const handleCombinationClick = (combinationId) => {
    navigate(`/communication/session-email-composer/${combinationId}?session_id=${selectedSessionId}`);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Session Enrollment Emails</h2>

      {/* Selection Card */}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Select Session</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Organization Selector */}
            <div className="col-md-6 mb-3">
              <label htmlFor="organizationSelect" className="form-label">
                Organization
              </label>
              <select
                id="organizationSelect"
                className="form-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
              >
                <option value="">Select an organization...</option>
                {organizations.sort((a, b) => a.name.localeCompare(b.name)).map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Session Selector */}
            <div className="col-md-6 mb-3">
              <label htmlFor="sessionSelect" className="form-label">
                Session
              </label>
              <select
                id="sessionSelect"
                className="form-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedOrgId}
              >
                <option value="">Select a session...</option>
                {filteredSessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.closed ? ' (Closed)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show Closed Sessions Checkbox */}
          <div className="row">
            <div className="col-12 mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showClosedSessions"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                  disabled={!selectedOrgId}
                />
                <label className="form-check-label" htmlFor="showClosedSessions">
                  Show closed sessions
                </label>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading enrollment combinations...</p>
        </div>
      )}

      {/* Combinations List Card */}
      {combinations && !loading && (
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">
              Enrollment Combinations for {combinations.organization_name} - {combinations.session_name}
            </h5>
          </div>
          <div className="card-body">
            {combinations.combinations.length === 0 ? (
              <div className="alert alert-info mb-0">
                No students are enrolled or waitlisted in this session.
              </div>
            ) : (
              <div className="list-group">
                {combinations.combinations.map((combo) => (
                  <button
                    key={combo.combination_id}
                    className="list-group-item list-group-item-action bg-white"
                    onClick={() => handleCombinationClick(combo.combination_id)}
                    style={{
                      color: 'black',
                      border: '2px solid transparent',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                      e.currentTarget.style.borderColor = '#0d6efd';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  >
                    <div className="d-flex w-100 justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h6 className="mb-2" style={{ color: 'black' }}>
                          {combo.student_count} {combo.student_count === 1 ? 'Student' : 'Students'}
                        </h6>

                        {combo.enrolled_classes.length > 0 && (
                          <div className="mb-2">
                            <strong style={{ color: 'black' }}>Enrolled:</strong>{' '}
                            <span style={{ color: '#6c757d' }}>
                              {formatClassList(combo.enrolled_classes)}
                            </span>
                          </div>
                        )}

                        {combo.waitlisted_classes.length > 0 && (
                          <div className="mb-2">
                            <strong style={{ color: 'black' }}>Waitlisted:</strong>{' '}
                            <span style={{ color: '#6c757d' }}>
                              {formatClassList(combo.waitlisted_classes)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ms-3" style={{ color: 'black' }}>
                        <i className="bi bi-chevron-right"></i>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionEmailList;
