import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { useParams, useNavigate } from 'react-router-dom';
import './ManageEnrollment.css';

function filterList(list, query) {
  if (!query) return list;
  return list.filter(s =>
    (s.display_name || s.full_name || '').toLowerCase().includes(query.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(query.toLowerCase())
  );
}

const ManageEnrollment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allStudents, setAllStudents] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [selectedAll, setSelectedAll] = useState([]);
  const [selectedEnrolled, setSelectedEnrolled] = useState([]);
  const [selectedWaitlist, setSelectedWaitlist] = useState([]);
  const [searchAll, setSearchAll] = useState('');
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [searchWaitlist, setSearchWaitlist] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Save handler
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const resp = await fetch(`/api/activity/${id}/enrollment/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          enrolled: enrolled.map(s => s.id),
          waitlist: waitlist.map(s => s.id),
        }),
      });
      if (!resp.ok) throw new Error('Failed to save enrollment');
      // On success, go back to class detail page
      navigate(`/classes/${id}`);
    } catch (err) {
      setError('Failed to save enrollment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      authFetch('/api/students/').then(r => r.json()),
      authFetch(`/api/activity/${id}/`).then(r => r.json())
    ])
      .then(([students, activity]) => {
        setAllStudents(students);
        setEnrolled(activity.students || []);
        setWaitlist(activity.waitlist || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load enrollment data');
        setLoading(false);
      });
  }, [id]);

  // Helper function to sort students by last name, then first name
  const sortByName = (a, b) => {
    const lastCompare = (a.last_name || '').localeCompare(b.last_name || '');
    if (lastCompare !== 0) return lastCompare;
    return (a.first_name || '').localeCompare(b.first_name || '');
  };

  // Compute available students (not enrolled or waitlisted), sorted by last name
  const enrolledIds = new Set(enrolled.map(s => s.id));
  const waitlistIds = new Set(waitlist.map(s => s.id));
  const available = allStudents.filter(s => !enrolledIds.has(s.id) && !waitlistIds.has(s.id))
    .slice().sort(sortByName);

  // Sort enrolled and waitlist by last name
  const sortedEnrolled = [...enrolled].sort(sortByName);
  const sortedWaitlist = [...waitlist].sort(sortByName);

  // Move functions
  const move = (from, setFrom, to, setTo, selected, setSelected) => {
    const toMove = from.filter(s => selected.includes(s.id));
    setFrom(from.filter(s => !selected.includes(s.id)));
    setTo([...to, ...toMove]);
    setSelected([]);
  };

  // Remove functions (move back to available)
  const remove = (from, setFrom, to, setTo, selected, setSelected) => {
    const toRemove = from.filter(s => selected.includes(s.id));
    setFrom(from.filter(s => !selected.includes(s.id)));
    setTo([...to, ...toRemove]);
    setSelected([]);
  };

  if (loading) return <div>Loading enrollment...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Manage Enrollment</h4>
        </div>
        <div className="card-body">
          <div className="row">
            {/* All Students */}
            <div className="col-md-4">
              <h6>All Students</h6>
              <input className="form-control mb-2" placeholder="Search..." value={searchAll} onChange={e => setSearchAll(e.target.value)} />
              <div className="sticky-action-row">
                <button className="btn-enroll btn-sm me-1" onClick={() => move(available, () => {}, enrolled, setEnrolled, selectedAll, setSelectedAll)} disabled={selectedAll.length === 0}>→ Enroll</button>
                <button className="btn-waitlist btn-sm" onClick={() => move(available, () => {}, waitlist, setWaitlist, selectedAll, setSelectedAll)} disabled={selectedAll.length === 0}>→ Waitlist</button>
              </div>
              <ul className="list-group manage-list">
                {filterList(available, searchAll).map(s => (
                  <li key={s.id} className="list-group-item">
                    <input
                      type="checkbox"
                      checked={selectedAll.includes(s.id)}
                      onChange={e => {
                        setSelectedAll(e.target.checked ? [...selectedAll, s.id] : selectedAll.filter(id => id !== s.id));
                      }}
                      id={`all-${s.id}`}
                    />{' '}
                    <span
                      className="student-name-box"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSelectedAll(selectedAll.includes(s.id) ? selectedAll.filter(id => id !== s.id) : [...selectedAll, s.id])}
                    >
                      {s.display_name || s.full_name || s.name || 'Unknown'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Enrolled */}
            <div className="col-md-4">
              <h6>Enrolled</h6>
              <input className="form-control mb-2" placeholder="Search..." value={searchEnrolled} onChange={e => setSearchEnrolled(e.target.value)} />
              <div className="sticky-action-row">
                <button className="btn-remove btn-sm me-1" onClick={() => remove(enrolled, setEnrolled, available, () => {}, selectedEnrolled, setSelectedEnrolled)} disabled={selectedEnrolled.length === 0}>← Remove</button>
                <button className="btn-waitlist btn-sm" onClick={() => move(enrolled, setEnrolled, waitlist, setWaitlist, selectedEnrolled, setSelectedEnrolled)} disabled={selectedEnrolled.length === 0}>→ Waitlist</button>
              </div>
              <ul className="list-group manage-list">
                {filterList(sortedEnrolled, searchEnrolled).map(s => (
                  <li key={s.id} className="list-group-item">
                    <input
                      type="checkbox"
                      checked={selectedEnrolled.includes(s.id)}
                      onChange={e => {
                        setSelectedEnrolled(e.target.checked ? [...selectedEnrolled, s.id] : selectedEnrolled.filter(id => id !== s.id));
                      }}
                      id={`enrolled-${s.id}`}
                    />{' '}
                    <span
                      className="student-name-box"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSelectedEnrolled(selectedEnrolled.includes(s.id) ? selectedEnrolled.filter(id => id !== s.id) : [...selectedEnrolled, s.id])}
                    >
                      {s.display_name || s.full_name || s.name || 'Unknown'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Waitlist */}
            <div className="col-md-4">
              <h6>Waitlist</h6>
              <input className="form-control mb-2" placeholder="Search..." value={searchWaitlist} onChange={e => setSearchWaitlist(e.target.value)} />
              <div className="sticky-action-row">
                <button className="btn-remove btn-sm me-1" onClick={() => remove(waitlist, setWaitlist, available, () => {}, selectedWaitlist, setSelectedWaitlist)} disabled={selectedWaitlist.length === 0}>← Remove</button>
                <button className="btn-enroll btn-sm" onClick={() => move(waitlist, setWaitlist, enrolled, setEnrolled, selectedWaitlist, setSelectedWaitlist)} disabled={selectedWaitlist.length === 0}>← Enroll</button>
              </div>
              <ul className="list-group manage-list">
                {filterList(sortedWaitlist, searchWaitlist).map(s => (
                  <li key={s.id} className="list-group-item">
                    <input
                      type="checkbox"
                      checked={selectedWaitlist.includes(s.id)}
                      onChange={e => {
                        setSelectedWaitlist(e.target.checked ? [...selectedWaitlist, s.id] : selectedWaitlist.filter(id => id !== s.id));
                      }}
                      id={`waitlist-${s.id}`}
                    />{' '}
                    <span
                      className="student-name-box"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSelectedWaitlist(selectedWaitlist.includes(s.id) ? selectedWaitlist.filter(id => id !== s.id) : [...selectedWaitlist, s.id])}
                    >
                      {s.display_name || s.full_name || s.name || 'Unknown'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4 d-flex justify-content-end">
            <button
              className="btn btn-primary me-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/classes/${id}`)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageEnrollment;
