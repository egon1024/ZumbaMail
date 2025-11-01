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