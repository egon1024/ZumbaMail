import React from "react";
import { Link } from "react-router-dom";

function SessionLink({ session, className = "" }) {
  if (!session) return null;
  const id = session.id || session;
  const name = session.name || session;
  return (
    <Link to={`/sessions/details/${id}`} className={`session-name-link ${className}`}>
      {name}
    </Link>
  );
}

export default SessionLink;
