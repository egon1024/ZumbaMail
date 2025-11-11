import { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { formatDate } from '../utils/formatDate';

function EndOfSessionReport() {
  const [organizations, setOrganizations] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [showClosed, setShowClosed] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load organizations on mount
  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await authFetch('/api/organizations/');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
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
      setReportData(null);
      setError(null);
      return;
    }

    // Clear selected session when organization changes
    setSelectedSessionId('');
    setReportData(null);
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

  // Auto-generate report when organization or session changes
  useEffect(() => {
    if (!selectedOrgId || !selectedSessionId) {
      setReportData(null);
      setError(null);
      return;
    }

    let isCancelled = false;

    const generateReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/reports/end-of-session/?organization_id=${selectedOrgId}&session_id=${selectedSessionId}`
        );

        if (isCancelled) return;

        if (!response.ok) {
          // Try to get error message from response
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || 'Failed to generate report. Please try again.';
          throw new Error(errorMessage);
        }

        const data = await response.json();
        if (!isCancelled) {
          setReportData(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Failed to generate report. Please try again.');
          setReportData(null);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    generateReport();

    return () => {
      isCancelled = true;
    };
  }, [selectedOrgId, selectedSessionId]);

  // Filter and sort sessions
  const filteredSessions = sessions
    .filter(session => {
      if (showClosed) return true;
      return !session.closed;
    })
    .sort((a, b) => {
      // Sort by start_date descending (most recent first)
      const dateA = new Date(a.start_date);
      const dateB = new Date(b.start_date);
      return dateB - dateA;
    });

  // Format session option text
  const formatSessionOption = (session) => {
    const dateRange = `${formatDate(session.start_date)} - ${formatDate(session.end_date)}`;
    const status = session.closed ? ' (Closed)' : '';
    return `${session.name} (${dateRange})${showClosed ? status : ''}`;
  };

  // Format the report text for copying
  const formatReportText = () => {
    if (!reportData) return '';

    const lines = [];
    lines.push(`${reportData.session_name} - ${reportData.organization_name}`);
    lines.push('');

    if (reportData.activities.length === 0) {
      lines.push('No classes in this session.');
    } else {
      reportData.activities.forEach(activity => {
        // Format as: "Monday Zumba: date1 (count1), date2 (count2), ..."
        const dateCounts = activity.date_counts
          .map(dc => `${formatDate(dc.date)} (${dc.count})`)
          .join(', ');
        lines.push(`${activity.day_of_week} ${activity.class_type}: ${dateCounts || 'No attendance recorded'}`);
      });
    }

    return lines.join('\n');
  };

  // Copy report to clipboard
  const copyToClipboard = () => {
    const text = formatReportText();
    navigator.clipboard.writeText(text).then(() => {
      alert('Report copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>End of Session Report</h2>

      {/* Selection Card */}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Report Parameters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Organization Selector */}
            <div className="col-md-6 mb-3">
              <label htmlFor="organization" className="form-label">Organization</label>
              <select
                id="organization"
                className="form-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
              >
                <option value="">Select an organization...</option>
                {organizations.sort((a, b) => a.name.localeCompare(b.name)).map(org => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
            </div>

            {/* Session Selector */}
            <div className="col-md-6 mb-3">
              <label htmlFor="session" className="form-label">Session</label>
              <select
                id="session"
                className="form-select"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={!selectedOrgId}
              >
                <option value="">Select a session...</option>
                {filteredSessions.map(session => (
                  <option key={session.id} value={session.id}>
                    {formatSessionOption(session)}
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
                  id="showClosed"
                  checked={showClosed}
                  onChange={(e) => setShowClosed(e.target.checked)}
                  disabled={!selectedOrgId}
                />
                <label className="form-check-label" htmlFor="showClosed">
                  Show closed sessions
                </label>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="alert alert-info mt-3 mb-0" role="alert">
              <i className="bi bi-hourglass-split me-2"></i>
              Generating report...
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {error}
            </div>
          )}

          {/* Instruction when no org selected */}
          {!selectedOrgId && !loading && !error && (
            <div className="alert alert-secondary mt-3 mb-0" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Please select an organization and session to view the end of session report.
            </div>
          )}

          {/* Instruction when org selected but no session */}
          {selectedOrgId && !selectedSessionId && !loading && !error && filteredSessions.length === 0 && (
            <div className="alert alert-warning mt-3 mb-0" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              No sessions available for this organization. Try enabling "Show closed sessions".
            </div>
          )}
        </div>
      </div>

      {/* Report Display Card */}
      {reportData && (
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{reportData.session_name} - {reportData.organization_name}</h5>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={copyToClipboard}
            >
              <i className="bi bi-clipboard me-1"></i>
              Copy to Clipboard
            </button>
          </div>
          <div className="card-body">
            {reportData.activities.length === 0 && (
              <div className="alert alert-info mb-3" role="alert">
                <i className="bi bi-info-circle me-2"></i>
                This session has no classes configured.
              </div>
            )}
            <pre style={{
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              fontSize: '1rem',
              marginBottom: 0,
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '0.25rem',
              border: '1px solid #dee2e6'
            }}>
              {formatReportText()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default EndOfSessionReport;
