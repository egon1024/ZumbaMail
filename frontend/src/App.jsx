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

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
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
          <Route path="/schedules" element={
            <PrivateRoute>
              <CancellationList />
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