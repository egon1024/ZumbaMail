import { NavLink } from 'react-router-dom';
import { useCallback } from 'react';
function Navbar() {
  // Collapse the menu if open (Bootstrap 5)
  const handleNavClick = useCallback(() => {
    const navbarCollapse = document.getElementById('navbarNav');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
      // Bootstrap 5 collapse API
      const collapse = window.bootstrap && window.bootstrap.Collapse
        ? window.bootstrap.Collapse.getOrCreateInstance(navbarCollapse)
        : null;
      if (collapse) {
        collapse.hide();
      } else {
        // fallback: force collapse by removing 'show' class
        navbarCollapse.classList.remove('show');
      }
    }
  }, []);
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink className="nav-link" to="/dashboard" onClick={handleNavClick}>Dashboard</NavLink>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="attendanceDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Attendance
              </a>
              <ul className="dropdown-menu" aria-labelledby="attendanceDropdown">
                <li><NavLink className="dropdown-item" to="/attendance/update" onClick={handleNavClick}>Update Attendance</NavLink></li>
                <li><NavLink className="dropdown-item" to="/attendance/signin" onClick={handleNavClick}>Generate Sign-In Sheet</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="commDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Communication
              </a>
              <ul className="dropdown-menu" aria-labelledby="commDropdown">
                <li><NavLink className="dropdown-item" to="/communication/email-all" onClick={handleNavClick}>Email All Participants</NavLink></li>
                <li><NavLink className="dropdown-item" to="/communication/email-waitlist" onClick={handleNavClick}>Email Waitlist</NavLink></li>
                <li><NavLink className="dropdown-item" to="/communication/email-student" onClick={handleNavClick}>Email Individual Student</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="reportsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Reports
              </a>
              <ul className="dropdown-menu" aria-labelledby="reportsDropdown">
                <li><NavLink className="dropdown-item" to="/reports/signin" onClick={handleNavClick}>Sign-In Sheets</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/attendance" onClick={handleNavClick}>Attendance Reports</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/classes" onClick={handleNavClick}>Class Reports</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/students" onClick={handleNavClick}>Student Reports</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="studentDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Students
              </a>
              <ul className="dropdown-menu" aria-labelledby="studentDropdown">
                <li><NavLink className="dropdown-item" to="/students" onClick={handleNavClick}>Student List</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="schedulesDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Schedules
              </a>
              <ul className="dropdown-menu" aria-labelledby="schedulesDropdown">
                <li><NavLink className="dropdown-item" to="/sessions" onClick={handleNavClick}>Sessions</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes" onClick={handleNavClick}>Classes</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes/assign" onClick={handleNavClick}>Assign Students</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes/waitlist" onClick={handleNavClick}>Manage Waitlist</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="peopleDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                People
              </a>
              <ul className="dropdown-menu" aria-labelledby="peopleDropdown">
                <li><NavLink className="dropdown-item" to="/organization" onClick={handleNavClick}>Organizations</NavLink></li>
                <li><NavLink className="dropdown-item" to="/contacts" onClick={handleNavClick}>Contacts</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
