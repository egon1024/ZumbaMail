import React from "react";
import { Link } from "react-router-dom";

function ContactLink({ contact, className = "" }) {
  if (!contact) return null;
  const id = contact.id || contact;
  const name = contact.name || contact;
  return (
    <Link to={`/contact/details/${id}`} className={`contact-name-link ${className}`}>
      {name}
    </Link>
  );
}

export default ContactLink;
