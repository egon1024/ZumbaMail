import React from "react";
import { Link } from "react-router-dom";

function Organization({ organization, className = "" }) {
  if (!organization) return null;
  // Accept either an object with id/name or just a name/id
  const id = organization.id || organization;
  const name = organization.name || organization.name || organization;
  // Future: add badges, tooltips, menus, etc.
  return (
    <Link to={`/organization/${id}`} className={`org-name-link ${className}`}>
      {name}
    </Link>
  );
}

export default Organization;
