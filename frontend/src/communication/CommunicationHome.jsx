import { Link } from 'react-router-dom';

function CommunicationHome() {
  // Define communication menu items
  const communicationItems = [
    {
      title: 'Session Enrollment Emails',
      description: 'Generate and send enrollment confirmation emails to students',
      path: '/communication/session-emails',
      icon: 'bi-envelope'
    }
    // Add more communication items here as they are created
  ];

  return (
    <div className="container mt-4">
      <h2 className="mb-4" style={{ color: '#6a359c' }}>Communication</h2>

      <div className="card shadow-sm border-primary">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">Available Communication Tools</h5>
        </div>
        <div className="card-body">
          <div className="list-group">
            {communicationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="list-group-item list-group-item-action"
                style={{
                  backgroundColor: 'white',
                  color: 'black',
                  textDecoration: 'none',
                  border: '2px solid transparent',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#0d6efd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
              >
                <div className="d-flex w-100 justify-content-between align-items-center">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center">
                      <i className={`bi ${item.icon} fs-3 me-3`} style={{ color: '#0d6efd' }}></i>
                      <div>
                        <h5 className="mb-1">{item.title}</h5>
                        <p className="mb-0 text-muted">{item.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="ms-3">
                    <i className="bi bi-chevron-right" style={{ color: 'black' }}></i>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunicationHome;
