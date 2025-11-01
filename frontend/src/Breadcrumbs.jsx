import React, { useEffect, useState } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { authFetch } from './utils/authFetch';

function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const [orgName, setOrgName] = useState(null);

  // Detect if on organization details page
  useEffect(() => {
    // Detect /organization/:id route
    if (pathnames[0] === 'organization' && pathnames[1] && !isNaN(Number(pathnames[1]))) {
      (async () => {
        try {
          const resp = await authFetch(`/api/organizations/${pathnames[1]}/details/`);
          if (resp.ok) {
            const data = await resp.json();
            setOrgName(data.organization.name);
          }
        } catch {}
      })();
    } else {
      setOrgName(null);
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
