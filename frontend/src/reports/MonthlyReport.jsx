import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../utils/authFetch';
import { formatDate, formatDateWithoutYear } from '../utils/formatDate';

function previousMonthDateRange() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const fmt = (d) => {
    const yy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };
  return { startDate: fmt(start), endDate: fmt(end) };
}

function MonthlyReport() {
  const defaults = useMemo(() => previousMonthDateRange(), []);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchOrganizations() {
      try {
        const response = await authFetch('/api/organizations/');
        if (!response.ok) throw new Error('Failed to fetch organizations');
        const data = await response.json();
        setOrganizations(data);
      } catch {
        setError('Failed to load organizations');
      }
    }
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (!selectedOrgId || !startDate || !endDate) {
      setReportData(null);
      setError(null);
      return;
    }

    if (startDate > endDate) {
      setReportData(null);
      setError('Start date must be on or before end date.');
      return;
    }

    let isCancelled = false;

    const generateReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          organization_id: selectedOrgId,
          start_date: startDate,
          end_date: endDate,
        });
        const response = await authFetch(`/api/reports/monthly/?${params}`);

        if (isCancelled) return;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || 'Failed to generate report. Please try again.';
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
  }, [selectedOrgId, startDate, endDate]);

  const formatReportText = () => {
    if (!reportData) return '';

    const lines = [];
    const range = `${formatDate(reportData.report_start_date)} - ${formatDate(reportData.report_end_date)}`;
    lines.push(`${reportData.organization_name} — Monthly (${range})`);
    lines.push('');

    if (reportData.activities.length === 0) {
      lines.push('No classes with meetings in this date range.');
    } else {
      reportData.activities.forEach((activity) => {
        const dateCounts = activity.date_counts
          .map((dc) => `${formatDateWithoutYear(dc.date)} (${dc.count})`)
          .join(', ');
        const loc = activity.location_name ? ` @ ${activity.location_name}` : '';
        lines.push(
          `${activity.day_of_week} ${activity.class_type}${loc}: ${dateCounts || 'No attendance recorded'}`
        );
      });
    }

    return lines.join('\n');
  };

  const copyToClipboard = () => {
    const text = formatReportText();
    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('Report copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy to clipboard');
      });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Monthly</h2>

      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Report Parameters</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4 mb-3">
              <label htmlFor="monthly-organization" className="form-label">Organization</label>
              <select
                id="monthly-organization"
                className="form-select"
                value={selectedOrgId}
                onChange={(e) => setSelectedOrgId(e.target.value)}
              >
                <option value="">Select an organization...</option>
                {organizations
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="monthly-start" className="form-label">Start date</label>
              <input
                id="monthly-start"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="col-md-4 mb-3">
              <label htmlFor="monthly-end" className="form-label">End date</label>
              <input
                id="monthly-end"
                type="date"
                className="form-control"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {loading && (
            <div className="alert alert-info mt-3 mb-0" role="alert">
              <i className="bi bi-hourglass-split me-2"></i>
              Generating report...
            </div>
          )}

          {error && (
            <div className="alert alert-danger mt-3 mb-0" role="alert">
              {error}
            </div>
          )}

          {!selectedOrgId && !loading && !error && (
            <div className="alert alert-secondary mt-3 mb-0" role="alert">
              <i className="bi bi-info-circle me-2"></i>
              Select an organization to view the monthly report.
            </div>
          )}

        </div>
      </div>

      {reportData && (
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              {reportData.organization_name} ({formatDate(reportData.report_start_date)} —{' '}
              {formatDate(reportData.report_end_date)})
            </h5>
            <button
              type="button"
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
                No classes with meetings in this date range.
              </div>
            )}
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontFamily: 'inherit',
                fontSize: '1rem',
                marginBottom: 0,
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '0.25rem',
                border: '1px solid #dee2e6',
              }}
            >
              {formatReportText()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonthlyReport;
