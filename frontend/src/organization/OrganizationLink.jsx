import React from "react";
import { Link } from "react-router-dom";
import Tooltip from "../utils/Tooltip";

function Organization({ organization, className = "" }) {
  if (!organization) return null;
  // Accept either an object with id/name or just a name/id
  const id = organization.id || organization;
  const name = organization.name || organization.name || organization;
  // Future: add badges, tooltips, menus, etc.
  return (
    <Tooltip tooltip={`View details for ${name}`}>
      <Link to={`/organization/${id}`} className={`clickable-text ${className}`}>
        {name}
      </Link>
    </Tooltip>
  );
}

export default Organization;
