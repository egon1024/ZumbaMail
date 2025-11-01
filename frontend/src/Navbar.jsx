import { NavLink } from 'react-router-dom';
function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <NavLink className="nav-link" to="/dashboard">Dashboard</NavLink>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="attendanceDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Attendance
              </a>
              <ul className="dropdown-menu" aria-labelledby="attendanceDropdown">
                <li><NavLink className="dropdown-item" to="/attendance/update">Update Attendance</NavLink></li>
                <li><NavLink className="dropdown-item" to="/attendance/signin">Generate Sign-In Sheet</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="commDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Communication
              </a>
              <ul className="dropdown-menu" aria-labelledby="commDropdown">
                <li><NavLink className="dropdown-item" to="/communication/email-all">Email All Participants</NavLink></li>
                <li><NavLink className="dropdown-item" to="/communication/email-waitlist">Email Waitlist</NavLink></li>
                <li><NavLink className="dropdown-item" to="/communication/email-student">Email Individual Student</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="reportsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Reports
              </a>
              <ul className="dropdown-menu" aria-labelledby="reportsDropdown">
                <li><NavLink className="dropdown-item" to="/reports/signin">Sign-In Sheets</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/attendance">Attendance Reports</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/classes">Class Reports</NavLink></li>
                <li><NavLink className="dropdown-item" to="/reports/students">Student Reports</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="studentDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Students
              </a>
              <ul className="dropdown-menu" aria-labelledby="studentDropdown">
                <li><NavLink className="dropdown-item" to="/students/add">Add/Edit Student</NavLink></li>
                <li><NavLink className="dropdown-item" to="/students/directory">Student Directory</NavLink></li>
                <li><NavLink className="dropdown-item" to="/students/details">Student Details</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="classDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Classes
              </a>
              <ul className="dropdown-menu" aria-labelledby="classDropdown">
                <li><NavLink className="dropdown-item" to="/classes/create">Create/Edit Class</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes/assign">Assign Students</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes/waitlist">Manage Waitlist</NavLink></li>
                <li><NavLink className="dropdown-item" to="/classes/details">Class Details</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="sessionDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Sessions
              </a>
              <ul className="dropdown-menu" aria-labelledby="sessionDropdown">
                <li><NavLink className="dropdown-item" to="/sessions/create">Create/Edit Session</NavLink></li>
                <li><NavLink className="dropdown-item" to="/sessions/manage">Start/End Session</NavLink></li>
                <li><NavLink className="dropdown-item" to="/sessions/details">Session Details</NavLink></li>
              </ul>
            </li>
            <li className="nav-item dropdown">
              <a className="nav-link dropdown-toggle" href="#" id="peopleDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                People
              </a>
              <ul className="dropdown-menu" aria-labelledby="peopleDropdown">
                <li><NavLink className="dropdown-item" to="/organization">Organizations</NavLink></li>
                <li><NavLink className="dropdown-item" to="/contacts">Contacts</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
