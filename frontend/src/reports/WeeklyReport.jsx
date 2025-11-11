import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';
import { formatDate } from '../utils/formatDate';

function WeeklyReport() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [includeExpectedAbsences, setIncludeExpectedAbsences] = useState(false);

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

  // Helper function to get the Sunday of the current week
  const getCurrentSunday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day; // Subtract days to get to Sunday
    const sunday = new Date(today.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  // Set default week to current week on mount
  useEffect(() => {
    setWeekStart(getCurrentSunday());
  }, []);

  // Helper function to format the date range
  const formatDateRange = (start, end) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Helper function to move to previous week
  const previousWeek = () => {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() - 7);
    setWeekStart(currentDate.toISOString().split('T')[0]);
  };

  // Helper function to move to next week
  const nextWeek = () => {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + 7);
    setWeekStart(currentDate.toISOString().split('T')[0]);
  };

  // Helper function to go to current week
  const goToCurrentWeek = () => {
    setWeekStart(getCurrentSunday());
  };

  // Auto-generate report when organization or week changes
  useEffect(() => {
    if (!selectedOrgId || !weekStart) {
      setReportData(null);
      return;
    }

    const generateReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/reports/weekly/?organization_id=${selectedOrgId}&week_start=${weekStart}`
        );
        if (!response.ok) throw new Error('Failed to generate report');
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError('Failed to generate report. Please try again.');
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [selectedOrgId, weekStart]);

  // Format the report text for copying
  const formatReportText = () => {
    if (!reportData) return '';

    const lines = [];
    lines.push(`For the week of ${formatDateRange(reportData.week_start, reportData.week_end)}`);
    lines.push('');

    if (reportData.meetings.length === 0) {
      lines.push('No classes scheduled for this week.');
    } else {
      reportData.meetings.forEach(meeting => {
        lines.push(`${meeting.day_of_week} ${meeting.class_type}: ${meeting.present_count} people attending`);

        // Show unexpected absences
        if (meeting.unexpected_absences.length > 0) {
          const names = meeting.unexpected_absences.map(s => s.name).join('; ');
          lines.push(`No shows: ${names}`);
        } else {
          lines.push('No shows: None');
        }

        // Show expected absences if checkbox is checked
        if (includeExpectedAbsences && meeting.expected_absences.length > 0) {
          const names = meeting.expected_absences.map(s => s.name).join('; ');
          lines.push(`Expected absences: ${names}`);
        }

        lines.push('');
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
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Weekly Attendance Report</h2>

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

            {/* Week Selector */}
            <div className="col-md-6 mb-3">
              <label htmlFor="weekStart" className="form-label">Week Starting (Sunday)</label>
              <div className="input-group">
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={previousWeek}
                  title="Previous Week"
                >
                  &lt;
                </button>
                <input
                  type="date"
                  id="weekStart"
                  className="form-control"
                  value={weekStart}
                  onChange={(e) => setWeekStart(e.target.value)}
                />
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={nextWeek}
                  title="Next Week"
                >
                  &gt;
                </button>
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  onClick={goToCurrentWeek}
                  title="Current Week"
                >
                  Today
                </button>
              </div>
              <small className="text-muted">Week runs Sunday through Saturday</small>
            </div>
          </div>

          {/* Options */}
          <div className="row">
            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="includeExpected"
                  checked={includeExpectedAbsences}
                  onChange={(e) => setIncludeExpectedAbsences(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="includeExpected">
                  Include expected absences in report
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
              Please select an organization to view the weekly report.
            </div>
          )}
        </div>
      </div>

      {/* Report Display Card */}
      {reportData && (
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Report - {reportData.organization_name}</h5>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={copyToClipboard}
            >
              <i className="bi bi-clipboard me-1"></i>
              Copy to Clipboard
            </button>
          </div>
          <div className="card-body">
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

export default WeeklyReport;
