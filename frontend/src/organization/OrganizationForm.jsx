import React from "react";

function OrganizationForm({ editMode }) {
  return (
    <div className="container mt-4">
      <h2>{editMode ? "Edit Organization" : "Add New Organization"}</h2>
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-body">
          <p>This is a placeholder for the organization form.</p>
          {/* TODO: Add form fields and logic here */}
        </div>
      </div>
    </div>
  );
}

export default OrganizationForm;
