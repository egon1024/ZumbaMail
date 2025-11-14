import { useState, useEffect, forwardRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { authFetch } from "../utils/authFetch";
import { formatTime } from "../utils/formatTime";
import { formatDate } from "../utils/formatDate";

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

export default function UpdateAttendance() {
  const [date, setDate] = useState(new Date());
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedClass, setSelectedClass] = useState(null);
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
  const [minDate, setMinDate] = useState(null);
  const [maxDate, setMaxDate] = useState(null);

  // Load organizations and sessions on mount
  useEffect(() => {
    setLoading(true);
    setError("");

    Promise.all([
      authFetch("/api/organizations/").then(res => res.json()),
      authFetch("/api/sessions/").then(res => res.json()),
      authFetch("/api/classes/").then(res => res.json())
    ])
      .then(([orgsData, sessionsData, classesData]) => {
        setOrganizations(Array.isArray(orgsData) ? orgsData : orgsData.organizations || []);
        const sessionsList = Array.isArray(sessionsData) ? sessionsData : sessionsData.sessions || [];
        setSessions(sessionsList);
        setClasses(classesData);

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

  // Filter classes by selected organization
  useEffect(() => {
    if (!selectedOrganization) {
      setFilteredClasses(classes);
    } else {
      setFilteredClasses(classes.filter(c => c.organization_id === parseInt(selectedOrganization)));
    }
    setSelectedClassId("");
  }, [selectedOrganization, classes]);

  // Load or create meeting when class is selected
  function handleClassSelect(classId) {
    const activity = filteredClasses.find(c => c.id === parseInt(classId));
    if (!activity) return;

    setSelectedClassId(classId);
    setSelectedClass(activity);
    setLoading(true);
    setError("");
    setSuccessMessage("");

    const dateString = date.toISOString().split('T')[0];

    authFetch("/api/meetings/get-or-create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: activity.id,
        date: dateString
      })
    })
      .then(res => res.json())
      .then(data => {
        setMeeting(data);
        setAttendanceRecords(data.attendance_records || []);

        const enrolledList = (data.enrolled_students || []).sort((a, b) => {
          const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
          if (lastNameCompare !== 0) return lastNameCompare;
          return (a.first_name || '').localeCompare(b.first_name || '');
        });

        const waitlistList = (data.waitlist_students || []).sort((a, b) => {
          const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
          if (lastNameCompare !== 0) return lastNameCompare;
          return (a.first_name || '').localeCompare(b.first_name || '');
        });

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
            first_name: record.student_first_name,
            last_name: record.student_last_name,
            email: ''
          }))
          .sort((a, b) => {
            const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
            if (lastNameCompare !== 0) return lastNameCompare;
            return (a.first_name || '').localeCompare(b.first_name || '');
          });

        setWalkInStudents(walkIns);
        setLoading(false);
      })
      .catch(err => {
        setError("Failed to load meeting data");
        setLoading(false);
      });
  }

  // Set attendance status for a student with auto-save
  function setAttendanceStatus(studentId, newStatus) {
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student === studentId);
      let updatedRecords;
      if (existing) {
        updatedRecords = prev.map(r => r.student === studentId ? { ...r, status: newStatus } : r);
      } else {
        updatedRecords = [...prev, { student: studentId, status: newStatus, note: '' }];
      }

      // Auto-save immediately with the updated records
      if (meeting) {
        authFetch(`/api/meetings/${meeting.id}/attendance/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendance: updatedRecords.map(r => ({
              student_id: r.student,
              status: r.status,
              note: r.note || ''
            }))
          })
        })
          .then(res => res.json())
          .then(data => {
            // Silent save - no success message
          })
          .catch(err => {
            setError("Failed to save attendance");
          });
      }

      return updatedRecords;
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

    setWalkInStudents(prev => {
      const updated = [...prev, student];
      return updated.sort((a, b) => {
        const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
        if (lastNameCompare !== 0) return lastNameCompare;
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    });

    // Automatically mark walk-in as present and auto-save
    setAttendanceRecords(prev => {
      const existing = prev.find(r => r.student === student.id);
      let updatedRecords;
      if (!existing) {
        updatedRecords = [...prev, { student: student.id, status: 'present', note: '' }];
      } else {
        updatedRecords = prev;
      }

      // Auto-save the new walk-in
      if (meeting && updatedRecords !== prev) {
        authFetch(`/api/meetings/${meeting.id}/attendance/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendance: updatedRecords.map(r => ({
              student_id: r.student,
              status: r.status,
              note: r.note || ''
            }))
          })
        })
          .then(res => res.json())
          .then(() => {
            // Silent save
          })
          .catch(() => {
            setError("Failed to save attendance");
          });
      }

      return updatedRecords;
    });

    setSearchQuery("");
    setSearchResults([]);
  }

  // Quick create new student
  function handleQuickCreate() {
    const [firstName, ...lastNameParts] = searchQuery.trim().split(/\s+/);
    const lastName = lastNameParts.join(' ') || '';

    if (!firstName) {
      setError("Please enter at least a first name");
      return;
    }

    authFetch("/api/students/quick-create/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        email: ""
      })
    })
      .then(res => res.json())
      .then(student => {
        setWalkInStudents(prev => {
          const updated = [...prev, student];
          return updated.sort((a, b) => {
            const lastNameCompare = (a.last_name || '').localeCompare(b.last_name || '');
            if (lastNameCompare !== 0) return lastNameCompare;
            return (a.first_name || '').localeCompare(b.first_name || '');
          });
        });

        // Automatically mark newly created walk-in as present and auto-save
        setAttendanceRecords(prev => {
          const existing = prev.find(r => r.student === student.id);
          let updatedRecords;
          if (!existing) {
            updatedRecords = [...prev, { student: student.id, status: 'present', note: '' }];
          } else {
            updatedRecords = prev;
          }

          // Auto-save the new walk-in
          if (meeting && updatedRecords !== prev) {
            authFetch(`/api/meetings/${meeting.id}/attendance/`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                attendance: updatedRecords.map(r => ({
                  student_id: r.student,
                  status: r.status,
                  note: r.note || ''
                }))
              })
            })
              .then(res => res.json())
              .then(() => {
                // Silent save
              })
              .catch(() => {
                setError("Failed to save attendance");
              });
          }

          return updatedRecords;
        });

        setSearchQuery("");
        setSearchResults([]);
      })
      .catch(err => {
        setError("Failed to create student");
      });
  }

  // Remove walk-in student with auto-save
  function removeWalkIn(studentId) {
    setWalkInStudents(prev => prev.filter(s => s.id !== studentId));

    setAttendanceRecords(prev => {
      const updatedRecords = prev.filter(r => r.student !== studentId);

      // Auto-save the removal
      if (meeting) {
        authFetch(`/api/meetings/${meeting.id}/attendance/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attendance: updatedRecords.map(r => ({
              student_id: r.student,
              status: r.status,
              note: r.note || ''
            }))
          })
        })
          .then(res => res.json())
          .then(() => {
            // Silent save
          })
          .catch(() => {
            setError("Failed to save attendance");
          });
      }

      return updatedRecords;
    });
  }

  // Clear all attendance (reset to scheduled)
  function handleClearAttendance() {
    if (!meeting) return;

    if (!window.confirm("Are you sure you want to clear all attendance for this class? This will reset all students to 'Scheduled' status.")) {
      return;
    }

    setLoading(true);
    setError("");

    // Set all records to 'scheduled'
    const clearedRecords = attendanceRecords.map(r => ({
      ...r,
      status: 'scheduled'
    }));

    authFetch(`/api/meetings/${meeting.id}/attendance/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendance: clearedRecords.map(r => ({
          student_id: r.student,
          status: r.status,
          note: r.note || ''
        }))
      })
    })
      .then(res => res.json())
      .then(() => {
        setAttendanceRecords(clearedRecords);
        setSuccessMessage("Attendance cleared successfully!");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to clear attendance");
        setLoading(false);
      });
  }

  return (
    <div className="container mt-4">
      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* Step 1: Date and Class Selection */}
      {!selectedClass && (
        <div className="card shadow-sm border-primary mb-4">
          <div className="card-header bg-dark text-white">
            <h4 className="mb-0">Update Attendance</h4>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <label htmlFor="date" className="form-label">Date</label>
              <DatePicker
                selected={date}
                onChange={setDate}
                customInput={<FormattedDateInput selectedDate={date} />}
                minDate={minDate}
                maxDate={maxDate}
                placeholderText="Select date"
              />
            </div>

            <div className="mb-3">
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

            <div className="mb-3">
              <label htmlFor="class" className="form-label">Class</label>
              <select
                id="class"
                className="form-select"
                value={selectedClassId}
                onChange={e => handleClassSelect(e.target.value)}
                disabled={loading}
              >
                <option value="">Select a class...</option>
                {filteredClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.organization_name} / {cls.session_name} - {cls.type} ({cls.day_of_week} at {formatTime(cls.time)}) - {cls.students_count} enrolled
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2-4: Attendance Marking Interface */}
      {selectedClass && meeting && (
        <div>
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setSelectedClass(null);
                setSelectedClassId("");
                setMeeting(null);
              }}
            >
              ← Back to Class Selection
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={handleClearAttendance}
              disabled={loading}
            >
              <i className="bi bi-x-circle me-1"></i>
              Clear All Attendance
            </button>
          </div>

          <div className="card shadow-sm border-primary mb-4">
            <div className="card-header bg-dark text-white">
              <h4 className="mb-1">{selectedClass.type}</h4>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                {selectedClass.organization_name} / {selectedClass.session_name}
                <br />
                {selectedClass.day_of_week} at {formatTime(selectedClass.time)} • {selectedClass.location}
                <br />
                Date: {formatDate(date.toISOString().split('T')[0])}
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
                          {student.email && <div className="text-muted small">{student.email}</div>}
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
                            {student.email && <div className="text-muted small">{student.email}</div>}
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
                      onClick={handleQuickCreate}
                    >
                      Create "{searchQuery}" as new student
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
                          {student.email && <div className="text-muted small">{student.email}</div>}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
