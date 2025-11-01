import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import PrivateRoute from './PrivateRoute';
import Header from './Header';
import Navbar from './Navbar';
import ListOrganizations from './organization/ListOrganizations';
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
        <Route path="/organization/list" element={
          <PrivateRoute>
            <ListOrganizations />
          </PrivateRoute>
        } />
        {/* Contact list route removed for now */}
        {/* Future routes for /classes, /attendance */}
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