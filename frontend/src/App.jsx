import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';
import Header from './Header';
import Navbar from './Navbar';
import ListOrganizations from './organization/ListOrganizations';
import OrganizationDetails from './organization/OrganizationDetails';
import OrganizationForm from './organization/OrganizationForm';
import ContactsList from './contact/ContactsList';
import Breadcrumbs from './Breadcrumbs';

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/';
  return (
    <>
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
            <OrganizationForm />
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
            <OrganizationForm editMode />
          </PrivateRoute>
        } />
        <Route path="/contacts" element={
          <PrivateRoute>
            <ContactsList />
          </PrivateRoute>
        } />
      </Routes>
    </>
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