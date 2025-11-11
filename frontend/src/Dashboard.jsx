import { useState, useEffect } from 'react';
import { authFetch } from './utils/authFetch';
import { formatTime } from './utils/formatTime';
import { APP_TITLE } from './appConfig';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    activeStudents: 0,
    activeClasses: 0,
    classesToday: 0,
    studentsOnWaitlist: 0
  });
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch('/api/students/').then(r => r.json()),
      authFetch('/api/classes/').then(r => r.json())
    ])
      .then(([students, classes]) => {
        // Calculate stats
        const activeStudents = students.filter(s => !s.inactive).length;
        const activeClasses = classes.length;

        // Get today's day of week
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = daysOfWeek[today.getDay()];

        const classesToday = classes.filter(c => c.day_of_week === todayName).length;

        // Sum up waitlist counts
        const studentsOnWaitlist = classes.reduce((sum, c) => sum + (c.waitlist_count || 0), 0);

        setStats({
          activeStudents,
          activeClasses,
          classesToday,
          studentsOnWaitlist
        });

        // Get upcoming classes (today and next 7 days)
        const upcoming = classes
          .filter(c => c.day_of_week === todayName)
          .sort((a, b) => {
            // Sort by time
            if (a.time < b.time) return -1;
            if (a.time > b.time) return 1;
            return 0;
          })
          .slice(0, 5); // Limit to 5 classes

        setUpcomingClasses(upcoming);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>{APP_TITLE} Dashboard</h2>

      {/* Quick Actions Card */}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Quick Actions</h5>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap gap-2">
            <a href="/attendance" className="btn btn-outline-primary dashboard-action-btn">
              <i className="bi bi-check2-square me-2"></i>
              Take Attendance
            </a>
            <a href="/students/new" className="btn btn-outline-success dashboard-action-btn">
              <i className="bi bi-person-plus me-2"></i>
              Add New Student
            </a>
            <a href="/classes/new" className="btn btn-outline-info dashboard-action-btn">
              <i className="bi bi-calendar-plus me-2"></i>
              Create New Class
            </a>
            <a href="/attendance/generate-signin-sheet" className="btn btn-outline-warning dashboard-action-btn">
              <i className="bi bi-file-earmark-spreadsheet me-2"></i>
              Generate Sign-In Sheet
            </a>
          </div>
        </div>
      </div>

      {/* Quick Stats Card */}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Quick Stats</h5>
        </div>
        <div className="card-body">
          <div className="row text-center">
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-box">
                <div className="stat-number text-primary">{stats.activeStudents}</div>
                <div className="stat-label">Active Students</div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-box">
                <div className="stat-number text-success">{stats.activeClasses}</div>
                <div className="stat-label">Active Classes</div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-box">
                <div className="stat-number text-info">{stats.classesToday}</div>
                <div className="stat-label">Classes Today</div>
              </div>
            </div>
            <div className="col-md-3 col-6 mb-3">
              <div className="stat-box">
                <div className="stat-number text-warning">{stats.studentsOnWaitlist}</div>
                <div className="stat-label">Students on Waitlists</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Classes Card */}
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Classes Today</h5>
          <a href="/classes" className="btn btn-sm btn-outline-light">View All Classes</a>
        </div>
        <div className="card-body">
          {upcomingClasses.length === 0 ? (
            <p className="text-muted mb-0">No classes scheduled for today.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm mb-0">
                <thead>
                  <tr>
                    <th></th>
                    <th>Type</th>
                    <th>Time</th>
                    <th>Location</th>
                    <th>Organization</th>
                    <th className="text-center">Enrolled</th>
                    <th className="text-center">Waitlist</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingClasses.map(cls => {
                    const today = new Date();
                    const dateStr = today.toISOString().split('T')[0];
                    const attendanceUrl = `/attendance?activity_id=${cls.id}&date=${dateStr}`;

                    return (
                      <tr key={cls.id} className="class-row">
                        <td className="attendance-icon-cell">
                          <a
                            href={attendanceUrl}
                            className="attendance-link"
                            title="Take Attendance"
                          >
                            <i className="bi bi-check2-square"></i>
                          </a>
                        </td>
                        <td className="clickable-cell class-detail-group">
                          <a href={`/classes/${cls.id}`} className="class-details-link">
                            {cls.type}
                          </a>
                        </td>
                        <td className="clickable-cell class-detail-group">
                          <a href={`/classes/${cls.id}`} className="class-details-link">
                            {formatTime(cls.time)}
                          </a>
                        </td>
                        <td className="clickable-cell class-detail-group">
                          <a href={`/classes/${cls.id}`} className="class-details-link">
                            {cls.location}
                          </a>
                        </td>
                        <td className="clickable-cell org-cell">
                          <a href={`/organization/${cls.organization_id}`} className="org-details-link">
                            {cls.organization_name}
                          </a>
                        </td>
                        <td className="text-center">
                          <span className={cls.students_count > 0 ? 'text-success fw-bold' : 'text-muted'}>
                            {cls.students_count}
                          </span>
                        </td>
                        <td className="text-center">
                          <span className={cls.waitlist_count > 0 ? 'text-warning fw-bold' : 'text-muted'}>
                            {cls.waitlist_count}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
