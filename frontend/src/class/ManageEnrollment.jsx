import React, { useEffect, useState } from 'react';
import { authFetch } from '../utils/authFetch';
import { useParams, useNavigate } from 'react-router-dom';
import { sortWaitlist, sortByLastFirstName, studentDisplayName } from '../utils/waitlistOrder';
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
  const [classData, setClassData] = useState(null);
  const [selectedAll, setSelectedAll] = useState([]);
  const [selectedEnrolled, setSelectedEnrolled] = useState([]);
  const [selectedWaitlist, setSelectedWaitlist] = useState([]);
  const [searchAll, setSearchAll] = useState('');
  const [searchEnrolled, setSearchEnrolled] = useState('');
  const [searchWaitlist, setSearchWaitlist] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  // Per-row draft rank inputs (string keyed by student id)
  const [rankDrafts, setRankDrafts] = useState({});
  const [rankingStudentId, setRankingStudentId] = useState(null);
  const [rankConflict, setRankConflict] = useState(null); // { student, rank, occupantName }

  const syncRankDrafts = (waitlistList) => {
    const drafts = {};
    waitlistList.forEach(s => {
      drafts[s.id] = s.waitlist_rank != null ? String(s.waitlist_rank) : '';
    });
    setRankDrafts(drafts);
  };

  // Auto-save handler
  const autoSave = async (enrolledList, waitlistList) => {
    setSaving(true);
    setError(null);
    try {
      const resp = await authFetch(`/api/activity/${id}/enrollment/`, {
        method: 'POST',
        body: JSON.stringify({
          enrolled: enrolledList.map(s => s.id),
          waitlist: waitlistList.map(s => s.id),
        }),
      });
      if (!resp.ok) throw new Error('Failed to save enrollment');
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
        const wl = activity.waitlist || [];
        setWaitlist(wl);
        syncRankDrafts(wl);
        setClassData(activity);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load enrollment data');
        setLoading(false);
      });
  }, [id]);

  const getEnrollmentColor = (count, maxCapacity) => {
    if (!maxCapacity) return '#000000';
    if (count > maxCapacity) return '#dc3545';
    if (count === maxCapacity) return '#ffc107';
    return '#28a745';
  };

  const enrolledIds = new Set(enrolled.map(s => s.id));
  const waitlistIds = new Set(waitlist.map(s => s.id));
  const available = sortByLastFirstName(
    allStudents.filter(s => !enrolledIds.has(s.id) && !waitlistIds.has(s.id))
  );

  const sortedEnrolled = sortByLastFirstName(enrolled);
  const sortedWaitlist = sortWaitlist(waitlist);

  const move = (from, setFrom, to, setTo, selected, setSelected) => {
    const toMove = from.filter(s => selected.includes(s.id));
    const newFrom = from.filter(s => !selected.includes(s.id));
    // Clear waitlist_rank locally when leaving waitlist (backend also clears)
    const clearedMove = toMove.map(s => (
      setFrom === setWaitlist ? { ...s, waitlist_rank: null } : s
    ));
    const newTo = [...to, ...clearedMove];
    setFrom(newFrom);
    setTo(newTo);
    setSelected([]);

    if (setFrom === setWaitlist) {
      syncRankDrafts(newFrom);
    }
    if (setTo === setWaitlist) {
      syncRankDrafts(newTo);
    }

    if (setTo === setEnrolled) {
      autoSave(newTo, setFrom === setWaitlist ? newFrom : waitlist);
    } else if (setTo === setWaitlist) {
      autoSave(setFrom === setEnrolled ? newFrom : enrolled, newTo);
    }
  };

  const remove = (from, setFrom, to, setTo, selected, setSelected) => {
    const toRemove = from.filter(s => selected.includes(s.id));
    const newFrom = from.filter(s => !selected.includes(s.id));
    setFrom(newFrom);
    setTo([...to, ...toRemove]);
    setSelected([]);

    if (setFrom === setWaitlist) {
      syncRankDrafts(newFrom);
    }

    if (setFrom === setEnrolled) {
      autoSave(newFrom, waitlist);
    } else if (setFrom === setWaitlist) {
      autoSave(enrolled, newFrom);
    }
  };

  const refreshWaitlistFromServer = async () => {
    const activity = await authFetch(`/api/activity/${id}/`).then(r => r.json());
    const wl = activity.waitlist || [];
    setWaitlist(wl);
    syncRankDrafts(wl);
  };

  const submitRank = async (student, force = false) => {
    const draft = rankDrafts[student.id];
    const trimmed = (draft ?? '').trim();
    let rankPayload = null;
    if (trimmed !== '') {
      if (!/^\d+$/.test(trimmed) || parseInt(trimmed, 10) < 1) {
        setError('Rank must be an integer greater than or equal to 1.');
        return;
      }
      rankPayload = parseInt(trimmed, 10);
    }

    setRankingStudentId(student.id);
    setError(null);
    try {
      const resp = await authFetch(`/api/activity/${id}/waitlist-rank/`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: student.id,
          rank: rankPayload,
          force,
        }),
      });
      const data = await resp.json().catch(() => ({}));

      if (resp.status === 409 && data.conflict) {
        setRankConflict({
          student,
          rank: rankPayload,
          occupantName: data.occupant_name || 'another student',
        });
        return;
      }

      if (!resp.ok) {
        setError(data.detail || 'Failed to update waitlist rank.');
        // Reset draft to server value
        setRankDrafts(prev => ({
          ...prev,
          [student.id]: student.waitlist_rank != null ? String(student.waitlist_rank) : '',
        }));
        return;
      }

      // Force/cascade may bump others — refresh full waitlist for accurate ranks
      await refreshWaitlistFromServer();
      setRankConflict(null);
    } catch (err) {
      setError('Failed to update waitlist rank. Please try again.');
    } finally {
      setRankingStudentId(null);
    }
  };

  const handleRankConflictYes = async () => {
    if (!rankConflict) return;
    const { student } = rankConflict;
    setRankConflict(null);
    await submitRank(student, true);
  };

  const handleRankConflictNo = () => {
    if (rankConflict) {
      const { student } = rankConflict;
      setRankDrafts(prev => ({
        ...prev,
        [student.id]: student.waitlist_rank != null ? String(student.waitlist_rank) : '',
      }));
    }
    setRankConflict(null);
  };

  if (loading) return <div>Loading enrollment...</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm border-primary mb-4">
        <div className="card-header bg-dark text-white">
          <h4 className="mb-0">Manage Enrollment</h4>
        </div>
        <div className="card-body">
          <div className="row">
            {/* All Students — stack like phone until xl so names stay readable */}
            <div className="col-12 col-xl-4">
              <h6>All Students ({available.length})</h6>
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
                      {studentDisplayName(s)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Enrolled */}
            <div className="col-12 col-xl-4">
              <h6>
                Enrolled{' '}
                {classData?.max_capacity ? (
                  <span
                    style={{
                      color: getEnrollmentColor(enrolled.length, classData.max_capacity),
                      fontWeight: enrolled.length >= classData.max_capacity ? 'bold' : 'normal'
                    }}
                  >
                    ({enrolled.length}/{classData.max_capacity})
                  </span>
                ) : (
                  `(${enrolled.length})`
                )}
              </h6>
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
                      {studentDisplayName(s)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Waitlist */}
            <div className="col-12 col-xl-4">
              <h6>Waitlist ({waitlist.length})</h6>
              <input className="form-control mb-2" placeholder="Search..." value={searchWaitlist} onChange={e => setSearchWaitlist(e.target.value)} />
              <div className="sticky-action-row">
                <button className="btn-remove btn-sm me-1" onClick={() => remove(waitlist, setWaitlist, available, () => {}, selectedWaitlist, setSelectedWaitlist)} disabled={selectedWaitlist.length === 0}>← Remove</button>
                <button className="btn-enroll btn-sm" onClick={() => move(waitlist, setWaitlist, enrolled, setEnrolled, selectedWaitlist, setSelectedWaitlist)} disabled={selectedWaitlist.length === 0}>← Enroll</button>
              </div>
              <ul className="list-group manage-list">
                {filterList(sortedWaitlist, searchWaitlist).map(s => (
                  <li key={s.id} className="list-group-item waitlist-rank-row">
                    <input
                      type="checkbox"
                      checked={selectedWaitlist.includes(s.id)}
                      onChange={e => {
                        setSelectedWaitlist(e.target.checked ? [...selectedWaitlist, s.id] : selectedWaitlist.filter(id => id !== s.id));
                      }}
                      id={`waitlist-${s.id}`}
                    />
                    <span
                      className="student-name-box waitlist-name-cell"
                      style={{ cursor: 'pointer', userSelect: 'none' }}
                      onClick={() => setSelectedWaitlist(selectedWaitlist.includes(s.id) ? selectedWaitlist.filter(id => id !== s.id) : [...selectedWaitlist, s.id])}
                    >
                      {studentDisplayName(s)}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control form-control-sm waitlist-rank-input"
                      aria-label={`Rank for ${studentDisplayName(s)}`}
                      title="Press Enter to set or clear rank"
                      value={rankDrafts[s.id] ?? ''}
                      disabled={rankingStudentId === s.id}
                      onChange={e => setRankDrafts(prev => ({ ...prev, [s.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitRank(s);
                        }
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            {saving && (
              <div className="alert alert-info">
                <i className="bi bi-arrow-repeat spin me-2"></i>
                Saving changes...
              </div>
            )}
            {error && (
              <div className="alert alert-danger">
                {error}
              </div>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/classes/${id}`)}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Class Details
            </button>
          </div>
        </div>
      </div>

      {rankConflict && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Apply anyway?</h5>
                <button type="button" className="btn-close" onClick={handleRankConflictNo} aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Rank {rankConflict.rank} is already used by {rankConflict.occupantName}.
                  Applying will shift contiguous ranks to make room.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={handleRankConflictYes}>
                  Yes
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleRankConflictNo}>
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEnrollment;
