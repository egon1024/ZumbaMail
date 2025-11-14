import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

function SessionEmailComposer() {
  const { combinationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!combinationId || !sessionId) {
      setError('Missing required parameters');
      return;
    }

    async function loadEmailDetails() {
      setLoading(true);
      setError(null);

      try {
        const response = await authFetch(
          `/api/communication/email-details/${combinationId}/?session_id=${sessionId}`
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to load email details');
        }

        const data = await response.json();
        setEmailData(data);
      } catch (err) {
        setError(err.message || 'Failed to load email details');
      } finally {
        setLoading(false);
      }
    }

    loadEmailDetails();
  }, [combinationId, sessionId]);

  const copyToClipboard = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getMailtoLink = () => {
    if (!emailData) return '#';
    return `mailto:${encodeURIComponent(emailData.to_email)}?subject=${encodeURIComponent(emailData.subject)}`;
  };

  const formatClassList = (classes) => {
    if (classes.length === 0) return 'None';
    return classes.map(cls => (
      <div key={`${cls.day_of_week}-${cls.type}-${cls.time}`} className="mb-2">
        <div><strong>{cls.day_of_week} {cls.type}</strong></div>
        <div className="text-muted small">Time: {cls.time}</div>
        <div className="text-muted small">Location: {cls.location}</div>
      </div>
    ));
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Compose Session Enrollment Email</h2>

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
          <p className="mt-2">Loading email details...</p>
        </div>
      )}

      {/* Email Details */}
      {emailData && !loading && (
        <>
          {/* Summary Card */}
          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Email Summary</h5>
            </div>
            <div className="card-body">
              <p className="mb-2">
                <strong>Recipients:</strong> {emailData.student_count} {emailData.student_count === 1 ? 'student' : 'students'}
              </p>
              {emailData.enrolled_classes.length > 0 && (
                <div className="mb-2">
                  <strong>Enrolled Classes:</strong>
                  <div className="ms-3 mt-2">
                    {formatClassList(emailData.enrolled_classes)}
                  </div>
                </div>
              )}
              {emailData.waitlisted_classes.length > 0 && (
                <div className="mb-2">
                  <strong>Waitlisted Classes:</strong>
                  <div className="ms-3 mt-2">
                    {formatClassList(emailData.waitlisted_classes)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compose Email Button Card */}
          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Compose Email</h5>
            </div>
            <div className="card-body text-center">
              <a
                href={getMailtoLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg"
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  border: '2px solid #198754',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  fontWeight: 'normal',
                  transition: 'all 0.2s ease-in-out'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#198754';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.color = 'black';
                }}
              >
                <i className="bi bi-envelope me-2"></i>
                Open Email Client
              </a>
              <div className="text-muted small mt-2">
                Opens your email client with To and Subject pre-filled (right-click for options)
              </div>
            </div>
          </div>

          {/* Email Content Card */}
          <div className="card shadow-sm border-primary">
            <div className="card-header bg-dark text-white">
              <h5 className="mb-0">Email Content</h5>
            </div>
            <div className="card-body">
              {/* To Field (Read-only) */}
              <div className="mb-3">
                <label className="form-label fw-bold">To:</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={emailData.to_email}
                    readOnly
                  />
                </div>
                <div className="text-muted small mt-1">
                  This is the email address that will appear in the "To" field
                </div>
              </div>

              {/* Subject Field (Read-only) */}
              <div className="mb-3">
                <label className="form-label fw-bold">Subject:</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={emailData.subject}
                    readOnly
                  />
                </div>
              </div>

              {/* BCC Field with Copy Button */}
              <div className="mb-3">
                <label className="form-label fw-bold">BCC:</label>
                <div className="input-group">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={emailData.bcc_emails}
                    readOnly
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => copyToClipboard(emailData.bcc_emails, 'bcc')}
                  >
                    {copiedField === 'bcc' ? (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        Copied!
                      </>
                    ) : (
                      <>
                        <i className="bi bi-clipboard me-1"></i>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="text-muted small mt-1">
                  Copy these email addresses and paste them into the BCC field of your email
                </div>
              </div>

              {/* Body Field with Copy Button */}
              <div className="mb-3">
                <label className="form-label fw-bold">Body:</label>
                <div className="input-group">
                  <textarea
                    className="form-control"
                    rows="15"
                    value={emailData.body}
                    readOnly
                    style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                  />
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => copyToClipboard(emailData.body, 'body')}
                  >
                    {copiedField === 'body' ? (
                      <>
                        <i className="bi bi-check-lg me-1"></i>
                        Copied!
                      </>
                    ) : (
                      <>
                        <i className="bi bi-clipboard me-1"></i>
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="text-muted small mt-1">
                  Copy this text and paste it into the body of your email
                </div>
              </div>

              {/* Back Button */}
              <div className="text-end">
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                >
                  <i className="bi bi-arrow-left me-1"></i>
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default SessionEmailComposer;
