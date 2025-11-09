import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { authFetch } from './utils/authFetch';
import { formatDate } from './utils/formatDate';
import ClassLabel from './class/ClassLabel';

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const [orgName, setOrgName] = useState(null);
  const [contactName, setContactName] = useState(null);
  const [sessionName, setSessionName] = useState(null);
  const [studentName, setStudentName] = useState(null);
  const [classActivity, setClassActivity] = useState(null);
  const [attendanceActivity, setAttendanceActivity] = useState(null);

  // Detect if on organization details page
  useEffect(() => {
    // Detect /organization/:id route
    if (pathnames[0] === 'organization' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/organizations/${pathnames[1]}/details/`);
          if (resp.ok) {
            const data = await resp.json();
            setOrgName(data.name);
          }
        } catch {}
      })();
    } else {
      setOrgName(null);
    }
    // Detect /contacts/:id route
    if (pathnames[0] === 'contacts' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/contacts/${pathnames[1]}/`);
          if (resp.ok) {
            const data = await resp.json();
            setContactName(data.name);
          }
        } catch {}
      })();
    } else {
      setContactName(null);
    }
    // Detect /sessions/:id route
    if (pathnames[0] === 'sessions' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/sessions/${pathnames[1]}/`);
          if (resp.ok) {
            const data = await resp.json();
            setSessionName(data.session?.name || null);
          }
        } catch {}
      })();
    } else {
      setSessionName(null);
    }
    // Detect /students/:id route
    if (pathnames[0] === 'students' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/students/${pathnames[1]}/details/`);
          if (resp.ok) {
            const data = await resp.json();
            setStudentName(data.display_name || (data.first_name && data.last_name ? `${data.last_name}, ${data.first_name}` : null));
          }
        } catch {}
      })();
    } else {
      setStudentName(null);
    }
    // Detect /classes/:id route
    if (pathnames[0] === 'classes' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/activity/${pathnames[1]}/`);
          if (resp.ok) {
            const data = await resp.json();
            setClassActivity(data);
          }
        } catch {}
      })();
    } else {
      setClassActivity(null);
    }
    // Detect /attendance/:id route
    if (pathnames[0] === 'attendance' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/activity/${pathnames[1]}/`);
          if (resp.ok) {
            const data = await resp.json();
            setAttendanceActivity(data);
          }
        } catch {}
      })();
    } else {
      setAttendanceActivity(null);
    }
  }, [location.pathname]);

  return (
    <nav aria-label="breadcrumb" className="mt-2 mb-3">
      <ol className="breadcrumb">
        <li className="breadcrumb-item">
          <Link to="/dashboard">Dashboard</Link>
        </li>
        {pathnames.map((value, idx) => {
          const to = `/${pathnames.slice(0, idx + 1).join('/')}`;
          const isLast = idx === pathnames.length - 1;
          let label = value.charAt(0).toUpperCase() + value.slice(1);
          // If on /organization/:id, show org name for id segment
          if (pathnames[0] === 'organization' && idx === 1 && orgName) {
            label = orgName;
          }
          // If on /contacts/:id, show contact name for id segment
          if (pathnames[0] === 'contacts' && idx === 1 && contactName) {
            label = contactName;
          }
          // If on /sessions/:id, show session name for id segment
          if (pathnames[0] === 'sessions' && idx === 1 && sessionName) {
            label = sessionName;
          }
          // If on /students/:id, show student name for id segment
          if (pathnames[0] === 'students' && idx === 1 && studentName) {
            label = studentName;
          }
          // If on /classes/:id, show ClassLabel for id segment
          if (pathnames[0] === 'classes' && idx === 1 && classActivity) {
            label = <ClassLabel activity={classActivity} />;
          }
          // If on /attendance/:id, show ClassLabel with date for id segment
          if (pathnames[0] === 'attendance' && idx === 1 && attendanceActivity) {
            // Extract date from query string
            const searchParams = new URLSearchParams(location.search);
            const dateParam = searchParams.get('date');
            const dateDisplay = dateParam ? ` (${formatDate(dateParam)})` : '';
            label = (
              <>
                <ClassLabel activity={attendanceActivity} />
                {dateDisplay}
              </>
            );
          }
          return isLast ? (
            <li className="breadcrumb-item active" aria-current="page" key={to}>
              {label}
            </li>
          ) : (
            <li className="breadcrumb-item" key={to}>
              <Link to={to}>{label}</Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
