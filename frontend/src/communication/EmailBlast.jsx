import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

function EmailBlast() {
    const [organizations, setOrganizations] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedSessionId, setSelectedSessionId] = useState('');

    // Filters
    const [studentStatus, setStudentStatus] = useState('active'); // active, inactive, both
    const [includeEnrolled, setIncludeEnrolled] = useState(true);
    const [includeWaitlisted, setIncludeWaitlisted] = useState(true);
    const [includeWalkin, setIncludeWalkin] = useState(true);

    const [emailData, setEmailData] = useState(null);
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
            return;
        }

        async function fetchSessions() {
            try {
                const response = await authFetch(`/api/sessions/?organization=${selectedOrgId}`);
                if (!response.ok) throw new Error('Failed to fetch sessions');
                const data = await response.json();
                setSessions(data.sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
            } catch (err) {
                try {
                    // Fallback attempt
                    const response = await authFetch('/api/sessions/');
                    if (!response.ok) throw new Error('Failed');
                    const data = await response.json();
                    setSessions(data.filter(s => String(s.organization) === String(selectedOrgId))
                        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
                } catch (e) {
                    setError('Failed to load sessions');
                }
            }
        }
        fetchSessions();
    }, [selectedOrgId]);

    const handleGenerate = async () => {
        // Session is now optional

        setLoading(true);
        setError(null);
        setEmailData(null);

        try {
            const params = new URLSearchParams();
            if (selectedOrgId) params.append('organization_id', selectedOrgId);
            if (selectedSessionId) params.append('session_id', selectedSessionId);
            params.append('active_status', studentStatus);

            if (includeEnrolled) params.append('inclusion_criteria', 'enrolled');
            if (includeWaitlisted) params.append('inclusion_criteria', 'waitlisted');
            if (includeWalkin) params.append('inclusion_criteria', 'walkin');

            const response = await authFetch(`/api/communication/email-blast/?${params.toString()}`);

            if (!response.ok) throw new Error('Failed to generate email list');

            const data = await response.json();
            setEmailData(data);
        } catch (err) {
            setError('Failed to generate email list. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenEmailClient = () => {
        if (!emailData) return;

        const mailtoLink = `mailto:${emailData.to_email}?bcc=${encodeURIComponent(emailData.bcc_emails)}`;
        window.location.href = mailtoLink;
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4" style={{ color: '#6a359c' }}>Email Blast</h2>

            {/* Selection Card */}
            <div className="card shadow-sm border-primary mb-4">
                <div className="card-header bg-dark text-white">
                    <h5 className="mb-0">Parameters</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        {/* Organization Selector */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="organization" className="form-label">Organization (Optional)</label>
                            <select
                                id="organization"
                                className="form-select"
                                value={selectedOrgId}
                                onChange={(e) => {
                                    setSelectedOrgId(e.target.value);
                                    if (!e.target.value) {
                                        setSelectedSessionId(''); // Reset session if org cleared
                                    }
                                    setEmailData(null); // Reset result
                                }}
                            >
                                <option value="">All Organizations</option>
                                {organizations.sort((a, b) => a.name.localeCompare(b.name)).map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Session Selector */}
                        <div className="col-md-6 mb-3">
                            <label htmlFor="session" className="form-label">Session (Optional)</label>
                            <select
                                id="session"
                                className="form-select"
                                value={selectedSessionId}
                                onChange={(e) => {
                                    setSelectedSessionId(e.target.value);
                                    setEmailData(null);
                                }}
                                disabled={!selectedOrgId}
                            >
                                <option value="">All Sessions</option>
                                {sessions.map(sess => (
                                    <option key={sess.id} value={sess.id}>{sess.name} ({sess.start_date} - {sess.end_date})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <hr className="my-4" />

                    {/* Student Status Filters */}
                    <div className="mb-3">
                        <label className="form-label d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.85rem' }}>Student Status</label>
                        <div className="btn-group" role="group" aria-label="Student active status">
                            <input
                                type="radio"
                                className="btn-check"
                                name="studentStatus"
                                id="statusActive"
                                value="active"
                                checked={studentStatus === 'active'}
                                onChange={(e) => setStudentStatus(e.target.value)}
                            />
                            <label className="btn btn-outline-primary" htmlFor="statusActive">Active Only</label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="studentStatus"
                                id="statusBoth"
                                value="both"
                                checked={studentStatus === 'both'}
                                onChange={(e) => setStudentStatus(e.target.value)}
                            />
                            <label className="btn btn-outline-primary" htmlFor="statusBoth">Both</label>

                            <input
                                type="radio"
                                className="btn-check"
                                name="studentStatus"
                                id="statusInactive"
                                value="inactive"
                                checked={studentStatus === 'inactive'}
                                onChange={(e) => setStudentStatus(e.target.value)}
                            />
                            <label className="btn btn-outline-primary" htmlFor="statusInactive">Inactive Only</label>
                        </div>
                    </div>

                    {/* Inclusion Criteria (Class Status) */}
                    <div className="mb-4">
                        <label className="form-label d-block text-muted text-uppercase fw-bold" style={{ fontSize: '0.85rem' }}>Include Students Who Are...</label>
                        <div className="d-flex gap-4">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="includeEnrolled"
                                    checked={includeEnrolled}
                                    onChange={(e) => setIncludeEnrolled(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="includeEnrolled">
                                    Enrolled in any class
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="includeWaitlisted"
                                    checked={includeWaitlisted}
                                    onChange={(e) => setIncludeWaitlisted(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="includeWaitlisted">
                                    Waitlisted for any class
                                </label>
                            </div>

                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="includeWalkin"
                                    checked={includeWalkin}
                                    onChange={(e) => setIncludeWalkin(e.target.checked)}
                                />
                                <label className="form-check-label" htmlFor="includeWalkin">
                                    Solely a Walk-in (not enrolled)
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Generating...
                            </>
                        ) : (
                            'Generate Email List'
                        )}
                    </button>

                    {/* Error Display */}
                    {error && (
                        <div className="alert alert-danger mt-3 mb-0" role="alert">
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Result Card */}
            {emailData && (
                <div className="card shadow-sm border-success">
                    <div className="card-header bg-success text-white">
                        <h5 className="mb-0">Recipient List Ready</h5>
                    </div>
                    <div className="card-body text-center py-5">
                        <h3 className="mb-4">Found {emailData.student_count} unique recipients</h3>

                        <div className="mb-4 text-start bg-light p-3 rounded" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <small className="text-muted d-block mb-2">Recipients included ({emailData.student_count}):</small>
                            <div style={{ fontSize: '0.875rem' }}>
                                {emailData.recipients ? (
                                    emailData.recipients.map((recipient, i) => (
                                        <div key={i} className="mb-1">
                                            <span className="fw-bold">{recipient.name}</span>
                                            <span className="text-muted ms-2">&lt;{recipient.email}&gt;</span>
                                        </div>
                                    ))
                                ) : (
                                    <code style={{ color: '#198754' }}>
                                        {emailData.bcc_emails.split(', ').map((email, i) => (
                                            <React.Fragment key={i}>
                                                {email}<br />
                                            </React.Fragment>
                                        ))}
                                    </code>
                                )}
                            </div>
                        </div>

                        <button
                            className="btn btn-lg btn-success"
                            onClick={handleOpenEmailClient}
                            disabled={emailData.student_count === 0}
                        >
                            <i className="bi bi-envelope-fill me-2"></i>
                            Open Email Client
                        </button>

                        <p className="text-muted mt-3 mb-0">
                            This will open your default email application with {emailData.student_count} recipients in the BCC field.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmailBlast;
