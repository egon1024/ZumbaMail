import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { authFetch } from "../utils/authFetch";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";

export default function AttendanceDetail() {
  const { id: activityId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dateParam = searchParams.get('date');

  const [activity, setActivity] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [waitlistStudents, setWaitlistStudents] = useState([]);
  const [walkInStudents, setWalkInStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Load meeting data on mount or when params change
  useEffect(() => {
    if (!activityId || !dateParam) {
      setError("Missing activity ID or date parameter");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    // Get or create the meeting
    authFetch("/api/meetings/get-or-create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: parseInt(activityId),
        date: dateParam
      })
    })
      .then(res => res.json())
      .then(data => {
        setMeeting(data);
        setAttendanceRecords(data.attendance_records || []);

        // Set activity info from meeting data
        setActivity({
          id: data.activity,
          type: data.activity_type,
          time: data.activity_time,
          location: data.activity_location,
          session_name: data.session_name,
          organization_name: data.organization_name
        });

        const enrolledList = data.enrolled_students || [];
        const waitlistList = data.waitlist_students || [];
        setEnrolledStudents(enrolledList);
        setWaitlistStudents(waitlistList);

        // Identify walk-ins: students with attendance records who are NOT enrolled or on waitlist
        const enrolledIds = new Set(enrolledList.map(s => s.id));
        const waitlistIds = new Set(waitlistList.map(s => s.id));

        const walkIns = (data.attendance_records || [])
          .filter(record => !enrolledIds.has(record.student) && !waitlistIds.has(record.student))
          .map(record => ({
            id: record.student,
            display_name: record.student_name,
            email: ''
          }));

        setWalkInStudents(walkIns);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load meeting data");
        setLoading(false);
      });
  }, [activityId, dateParam]);

  // Set attendance status for a student
  function setAttendanceStatus(studentId, newStatus) {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student === studentId);
      if (existing) {
        return prev.map(r => r.student === studentId ? { ...r, status: newStatus } : r);
      } else {
        return [...prev, { student: studentId, status: newStatus, note: '' }];
      }
    });
  }

  // Get attendance status for a student
  function getAttendanceStatus(studentId) {
    const record = attendanceRecords.find(r => r.student === studentId);
    return record?.status || 'scheduled';
  }

  // Search for walk-in students
  function handleSearch() {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    authFetch(`/api/students/search/?q=${encodeURIComponent(searchQuery)}`)
      .then(res => res.json())
      .then(data => {
        // Filter out students who are already enrolled, on waitlist, or added as walk-ins
        const filtered = data.filter(student =>
          !enrolledStudents.some(s => s.id === student.id) &&
          !waitlistStudents.some(s => s.id === student.id) &&
          !walkInStudents.some(s => s.id === student.id)
        );
        setSearchResults(filtered);
      })
      .catch(err => {
        setError("Failed to search students");
      });
  }

  // Add walk-in student from search results
  function addWalkIn(student) {
    // Check if already in enrolled, waitlist, or walk-ins
    const alreadyPresent =
      enrolledStudents.some(s => s.id === student.id) ||
      waitlistStudents.some(s => s.id === student.id) ||
      walkInStudents.some(s => s.id === student.id);

    if (alreadyPresent) {
      setError("Student is already in the attendance list");
      return;
    }

    setWalkInStudents(prev => [...prev, student]);

    // Automatically mark walk-in as present
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student === student.id);
      if (!existing) {
        return [...prev, { student: student.id, status: 'present', note: '' }];
      }
      return prev;
    });

    setSearchQuery("");
    setSearchResults([]);
  }

  // Navigate to student creation page
  function handleCreateStudent() {
    // Navigate to student creation with return URL
    const returnUrl = `/attendance/${activityId}?date=${dateParam}`;
    navigate(`/students/new?returnUrl=${encodeURIComponent(returnUrl)}&name=${encodeURIComponent(searchQuery)}`);
  }

  // Remove walk-in student
  function removeWalkIn(studentId) {
    setWalkInStudents(prev => prev.filter(s => s.id !== studentId));
    setAttendanceRecords(prev => prev.filter(r => r.student !== studentId));
  }

  // Save attendance
  function handleSave() {
    if (!meeting) return;

    setLoading(true);
    setError("");

    authFetch(`/api/meetings/${meeting.id}/attendance/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendance: attendanceRecords.map(r => ({
          student_id: r.student,
          status: r.status,
          note: r.note || ''
        }))
      })
    })
      .then(res => res.json())
      .then(data => {
        setSuccessMessage("Attendance saved successfully!");
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to save attendance");
        setLoading(false);
      });
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger">{error}</div>
        <button type="button" className="btn btn-secondary" onClick={() => navigate('/attendance')}>
          ← Back to Attendance
        </button>
      </div>
    );
  }

  if (!activity || !meeting) {
    return (
      <div className="container mt-4">
        <div>Loading meeting data...</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-1">{activity.type}</h4>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {activity.organization_name} / {activity.session_name}
            <br />
            {formatTime(activity.time)} • {activity.location}
            <br />
            Date: {formatDate(dateParam)}
          </div>
        </div>

            <div className="card-body">
              {/* Enrolled Students */}
              <h5>Enrolled Students</h5>
              {enrolledStudents.length === 0 ? (
                <p className="text-muted">No enrolled students</p>
              ) : (
                <div className="mb-4">
                  {enrolledStudents.map(student => {
                    const status = getAttendanceStatus(student.id);
                    return (
                      <div key={student.id} className="border rounded p-2 mb-2 bg-white d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{student.display_name}</strong>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className={`btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setAttendanceStatus(student.id, 'present')}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${status === 'unexpected_absence' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setAttendanceStatus(student.id, 'unexpected_absence')}
                          >
                            Unexpected
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm ${status === 'expected_absence' ? 'btn-dark' : 'btn-outline-secondary'}`}
                            onClick={() => setAttendanceStatus(student.id, 'expected_absence')}
                          >
                            Expected
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Waitlist Students */}
              {waitlistStudents.length > 0 && (
                <>
                  <h5>Waitlist Students</h5>
                  <div className="mb-4">
                    {waitlistStudents.map(student => {
                      const status = getAttendanceStatus(student.id);
                      return (
                        <div key={student.id} className="border rounded p-2 mb-2 bg-white d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{student.display_name}</strong>
                            <span className="badge bg-warning text-dark ms-2">Waitlist</span>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className={`btn btn-sm ${status === 'present' ? 'btn-success' : 'btn-outline-success'}`}
                              onClick={() => setAttendanceStatus(student.id, 'present')}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${status === 'unexpected_absence' ? 'btn-danger' : 'btn-outline-danger'}`}
                              onClick={() => setAttendanceStatus(student.id, 'unexpected_absence')}
                            >
                              Unexpected
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${status === 'expected_absence' ? 'btn-dark' : 'btn-outline-secondary'}`}
                              onClick={() => setAttendanceStatus(student.id, 'expected_absence')}
                            >
                              Expected
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Walk-in Students */}
              <h5>Walk-in Students</h5>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search for student by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyUp={handleSearch}
                />
                {searchResults.length > 0 && (
                  <div className="border rounded mt-2 bg-white">
                    {searchResults.map(student => (
                      <button
                        key={student.id}
                        type="button"
                        className="btn btn-light text-start w-100 border-bottom"
                        onClick={() => addWalkIn(student)}
                      >
                        {student.display_name}
                        {student.email && <span className="text-muted ms-2">({student.email})</span>}
                      </button>
                    ))}
                  </div>
                )}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <div className="mt-2">
                    <p className="text-muted small mb-2">No students found. Create a new student record?</p>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={handleCreateStudent}
                    >
                      Create new student "{searchQuery}"
                    </button>
                  </div>
                )}
              </div>

              {walkInStudents.length > 0 && (
                <div className="mb-4">
                  {walkInStudents.map(student => {
                    return (
                      <div key={student.id} className="border rounded p-2 mb-2 bg-white d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{student.display_name}</strong>
                          <span className="badge bg-info text-dark ms-2">Walk-in</span>
                        </div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => removeWalkIn(student.id)}
                            title="Remove walk-in"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Attendance"}
                </button>
              </div>
            </div>
          </div>
    </div>
  );
}
