import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';
import Header from './Header';
import Navbar from './Navbar';
import ListOrganizations from './organization/ListOrganizations';
import OrganizationDetails from './organization/OrganizationDetails';
import OrganizationForm from './organization/OrganizationForm';
import OrganizationCreate from './organization/OrganizationCreate';
import OrganizationEdit from './organization/OrganizationEdit';
import LocationList from './location/LocationList';
import LocationDetail from './location/LocationDetail';
import LocationCreate from './location/LocationCreate';
import { checkTokenExpiration } from './utils/authFetch';
import ContactsList from './contact/ContactsList';
import ContactDetails from './contact/ContactDetails';
import ContactEdit from './contact/ContactEdit';
import ContactCreate from './contact/ContactCreate';
import SessionsList from './session/SessionsList';
import SessionEdit from './session/SessionEdit';
import SessionCreate from './session/SessionCreate';
import StudentsList from './student/StudentsList';
import SessionDetails from './session/SessionDetails';
import StudentDetails from './student/StudentDetails';
import StudentEdit from './student/StudentEdit';
import StudentCreate from './student/StudentCreate';
import ClassList from './class/ClassList';
import ClassDetail from './class/ClassDetail';
import ManageEnrollment from './class/ManageEnrollment';
import Breadcrumbs from './Breadcrumbs';
import './roundedCards.css';
import './globalBackground.css';
import './utils/tooltip.css';
import ClassEdit from './class/ClassEdit';
import AttendanceList from './attendance/AttendanceList';
import AttendanceDetail from './attendance/AttendanceDetail';
import CancellationList from './cancellations/CancellationList';
import GenerateSignInSheet from './attendance/GenerateSignInSheet';
import WeeklyReport from './reports/WeeklyReport';
import CumulativeReport from './reports/CumulativeReport';
import EndOfSessionReport from './reports/EndOfSessionReport';
import ResidencyReport from './reports/ResidencyReport';
import CommunicationHome from './communication/CommunicationHome';
import SessionEmailList from './communication/SessionEmailList';
import SessionEmailComposer from './communication/SessionEmailComposer';

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  let lastKeystrokeCheckTime = 0;

  useEffect(() => {
    // Don't check session activity on the login page
    if (isLoginPage) return;

    const handleKeyDown = async (event) => {
      const targetTagName = event.target.tagName;
      const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetTagName);

      if (isInputField) {
        const currentTime = Date.now();
        // Check JWT expiration at most once every 2 seconds on keystroke in an input field
        if (currentTime - lastKeystrokeCheckTime > 2000) {
          lastKeystrokeCheckTime = currentTime;
          if (!(await checkTokenExpiration())) {
            // If token is expired, redirect to login
            window.location.href = '/';
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [location.pathname, isLoginPage]); // Re-attach listener if path changes

  let lastClickCheckTime = 0;
  useEffect(() => {
    // Don't check session activity on the login page
    if (isLoginPage) return;

    const handleClick = async () => {
      const currentTime = Date.now();
      // Check JWT expiration at most once every 2 seconds on any click
      if (currentTime - lastClickCheckTime > 2000) {
        lastClickCheckTime = currentTime;
        if (!(await checkTokenExpiration())) {
          // If token is expired, redirect to login
          window.location.href = '/';
        }
      }
    };

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [location.pathname, isLoginPage]); // Re-attach listener if path changes
  return (
    <div className="global-bg">
      {!isLoginPage && <Header />}
      {!isLoginPage && <Navbar />}
      {!isLoginPage && <Breadcrumbs />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <div className="container-fluid p-3">
              <Dashboard />
            </div>
          </PrivateRoute>
        } />
        <Route path="/organization" element={
          <PrivateRoute>
            <ListOrganizations />
          </PrivateRoute>
        } />
        <Route path="/organization/new" element={
          <PrivateRoute>
            <OrganizationCreate />
          </PrivateRoute>
        } />
        <Route path="/organization/:id" element={
          <PrivateRoute>
            <div className="container-fluid p-3">
              <OrganizationDetails />
            </div>
          </PrivateRoute>
        } />
        <Route path="/organization/:id/edit" element={
          <PrivateRoute>
            <OrganizationEdit />
          </PrivateRoute>
        } />
        <Route path="/locations" element={
          <PrivateRoute>
            <LocationList />
          </PrivateRoute>
        } />
        <Route path="/locations/:id" element={
          <PrivateRoute>
            <LocationDetail />
          </PrivateRoute>
        } />
        <Route path="/locations/new" element={
          <PrivateRoute>
            <LocationCreate />
          </PrivateRoute>
        } />
        <Route path="/contacts" element={
          <PrivateRoute>
            <ContactsList />
          </PrivateRoute>
        } />
        <Route path="/sessions" element={
          <PrivateRoute>
            <SessionsList />
          </PrivateRoute>
        } />
        <Route path="/sessions/:id" element={
          <PrivateRoute>
            <SessionDetails />
          </PrivateRoute>
        } />
        <Route path="/sessions/:id/edit" element={
          <PrivateRoute>
            <SessionEdit />
          </PrivateRoute>
        } />
        <Route path="/sessions/new" element={
          <PrivateRoute>
            <SessionCreate />
          </PrivateRoute>
        } />
        <Route path="/contacts/new" element={
          <PrivateRoute>
            <ContactCreate />
          </PrivateRoute>
        } />
        <Route path="/contacts/:id" element={
          <PrivateRoute>
            <ContactDetails />
          </PrivateRoute>
        } />
        <Route path="/contacts/:id/edit" element={
          <PrivateRoute>
            <ContactEdit />
          </PrivateRoute>
        } />
          <Route path="/students" element={
            <PrivateRoute>
              <StudentsList />
            </PrivateRoute>
          } />
          <Route path="/students/:id" element={
            <PrivateRoute>
              <StudentDetails />
            </PrivateRoute>
          } />
          <Route path="/students/new" element={
            <PrivateRoute>
              <StudentCreate />
            </PrivateRoute>
          } />
          <Route path="/students/:id/edit" element={
            <PrivateRoute>
              <StudentEdit />
            </PrivateRoute>
          } />
          <Route path="/class" element={
            <PrivateRoute>
              <ClassList />
            </PrivateRoute>
          } />
          <Route path="/classes" element={
            <PrivateRoute>
              <ClassList />
            </PrivateRoute>
          } />
          <Route path="/classes/:id" element={
            <PrivateRoute>
              <ClassDetail />
            </PrivateRoute>
          } />
          <Route path="/classes/:id/enrollment" element={
            <PrivateRoute>
              <ManageEnrollment />
            </PrivateRoute>
          } />
          <Route path="/classes/new" element={
            <PrivateRoute>
              <ClassEdit />
            </PrivateRoute>
          } />
          <Route path="/classes/:id/edit" element={
            <PrivateRoute>
              <ClassEdit />
            </PrivateRoute>
          } />
          <Route path="/attendance" element={
            <PrivateRoute>
              <AttendanceList />
            </PrivateRoute>
          } />
          <Route path="/attendance/:id" element={
            <PrivateRoute>
              <AttendanceDetail />
            </PrivateRoute>
          } />
          <Route path="/attendance/signin" element={
            <PrivateRoute>
              <GenerateSignInSheet />
            </PrivateRoute>
          } />
          <Route path="/schedules" element={
            <PrivateRoute>
              <CancellationList />
            </PrivateRoute>
          } />
          <Route path="/reports/weekly" element={
            <PrivateRoute>
              <WeeklyReport />
            </PrivateRoute>
          } />
          <Route path="/reports/cumulative" element={
            <PrivateRoute>
              <CumulativeReport />
            </PrivateRoute>
          } />
          <Route path="/reports/end-of-session" element={
            <PrivateRoute>
              <EndOfSessionReport />
            </PrivateRoute>
          } />
          <Route path="/reports/residency" element={
            <PrivateRoute>
              <ResidencyReport />
            </PrivateRoute>
          } />
          <Route path="/communication" element={
            <PrivateRoute>
              <CommunicationHome />
            </PrivateRoute>
          } />
          <Route path="/communication/session-emails" element={
            <PrivateRoute>
              <SessionEmailList />
            </PrivateRoute>
          } />
          <Route path="/communication/session-email-composer/:combinationId" element={
            <PrivateRoute>
              <SessionEmailComposer />
            </PrivateRoute>
          } />
      </Routes>
  </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;