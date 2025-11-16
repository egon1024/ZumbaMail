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
  const [locationName, setLocationName] = useState(null);
  const [classActivity, setClassActivity] = useState(null);
  const [attendanceActivity, setAttendanceActivity] = useState(null);
  const [emailComboName, setEmailComboName] = useState(null);

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
    // Detect /locations/:id route
    if (pathnames[0] === 'locations' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/locations/${pathnames[1]}/`);
          if (resp.ok) {
            const data = await resp.json();
            setLocationName(data.name);
          }
        } catch {}
      })();
    } else {
      setLocationName(null);
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
    // Detect /communication/session-email-composer/:combinationId route
    if (pathnames[0] === 'communication' && pathnames[1] === 'session-email-composer' && pathnames[2]) {
      (async () => {
        try {
          const searchParams = new URLSearchParams(location.search);
          const sessionId = searchParams.get('session_id');
          if (sessionId) {
            const resp = await authFetch(`/api/communication/email-details/${pathnames[2]}/?session_id=${sessionId}`);
            if (resp.ok) {
              const data = await resp.json();
              setEmailComboName(`${data.organization_name} - ${data.session_name} - ${data.combination_name}`);
            }
          }
        } catch {}
      })();
    } else {
      setEmailComboName(null);
    }
  }, [location.pathname, location.search]);

  return (
    <nav aria-label="breadcrumb" className="mt-2 mb-3 ms-3">
      <ol className="breadcrumb">
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
          // If on /locations/:id, show location name for id segment
          if (pathnames[0] === 'locations' && idx === 1 && locationName) {
            label = locationName;
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
          // If on /communication/session-email-composer/:combinationId, show custom name
          if (pathnames[0] === 'communication' && pathnames[1] === 'session-email-composer' && idx === 2 && emailComboName) {
            label = emailComboName;
          }
          // Rename "session-email-composer" to "Session Emails" and link to session-emails page
          if (pathnames[0] === 'communication' && idx === 1 && value === 'session-email-composer') {
            label = 'Session Emails';
            // Override the link to point to session-emails instead
            return (
              <li className="breadcrumb-item" key={to}>
                <Link to="/communication/session-emails">{label}</Link>
              </li>
            );
          }
          // Rename "session-emails" to "Session Emails"
          if (pathnames[0] === 'communication' && idx === 1 && value === 'session-emails') {
            label = 'Session Emails';
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
