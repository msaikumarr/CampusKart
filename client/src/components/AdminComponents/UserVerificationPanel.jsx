import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/api';

const STATUS_STYLES = {
  approved: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Verified' },
  pending:  { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', label: 'Pending' },
  rejected: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Rejected' },
};

const UserVerificationPanel = () => {
  const [pendingUsers, setPendingUsers]     = useState([]);
  const [allUsers, setAllUsers]             = useState([]);
  const [loading, setLoading]               = useState(false);
  const [toast, setToast]                   = useState(null);
  const [filterStatus, setFilterStatus]     = useState('pending');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [search, setSearch]                 = useState('');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = filterStatus === 'pending'
        ? `${API_BASE_URL}/api/admin/verifications/pending`
        : `${API_BASE_URL}/api/admin/users`;
      const res = await axios.get(endpoint, { withCredentials: true });
      if (filterStatus === 'pending') setPendingUsers(res.data.pendingUsers || []);
      else setAllUsers(res.data.users || []);
    } catch {
      showToast('Failed to load users.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleApprove = async (userId) => {
    try {
      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/approve`, {}, { withCredentials: true });
      showToast('User verified successfully!');
      fetchUsers();
    } catch {
      showToast('Failed to verify user.', 'error');
    }
  };

  const handleReject = async (userId) => {
    if (!rejectionReason.trim()) { showToast('Please provide a rejection reason.', 'error'); return; }
    try {
      await axios.put(`${API_BASE_URL}/api/admin/users/${userId}/reject`, { rejectionReason }, { withCredentials: true });
      showToast('User verification rejected.');
      setRejectionReason('');
      setSelectedUserId(null);
      fetchUsers();
    } catch {
      showToast('Failed to reject user.', 'error');
    }
  };

  const users = filterStatus === 'pending' ? pendingUsers : allUsers;

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold"
          style={toast.type === 'error'
            ? { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }
            : { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a' }}>
          {toast.type === 'error'
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          {toast.msg}
        </div>
      )}

      {/* Header + search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: '#1e293b' }}>User Verification</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Review and approve student verification requests</p>
        </div>
        <div className="flex items-center rounded-xl border gap-2 px-3 sm:w-64"
          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
          <svg className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="flex-1 bg-transparent text-sm py-2.5 outline-none"
            style={{ color: '#1e293b' }} />
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {[
          { key: 'pending', label: 'Pending', count: pendingUsers.length },
          { key: 'all',     label: 'All Users', count: allUsers.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilterStatus(tab.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all"
            style={filterStatus === tab.key
              ? { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8', color: '#faf8f4' }
              : { backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#475569' }}>
            {tab.label}
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={filterStatus === tab.key
                ? { backgroundColor: 'rgba(255,255,255,0.25)', color: '#faf8f4' }
                : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
              {tab.count}
            </span>
          </button>
        ))}
        <button onClick={fetchUsers}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
          style={{ borderColor: '#bfdbfe', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border p-4 flex items-center gap-4 animate-pulse"
              style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#e2e8f0' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 rounded" style={{ backgroundColor: '#e2e8f0' }} />
                <div className="h-3 w-48 rounded" style={{ backgroundColor: '#e2e8f0' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#eff6ff' }}>
            <svg className="w-8 h-8" style={{ color: '#1d4ed8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-bold" style={{ color: '#1e293b' }}>
            {search ? 'No users match your search' : filterStatus === 'pending' ? 'No pending verifications' : 'No users found'}
          </p>
        </div>
      )}

      {/* User rows */}
      {!loading && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map(u => {
            const st = STATUS_STYLES[u.verificationStatus] || STATUS_STYLES.pending;
            return (
              <div key={u._id} className="rounded-2xl border overflow-hidden"
                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>

                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}>
                    {(u.username || u.email || '?')[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm" style={{ color: '#1e293b' }}>{u.username || '—'}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: st.bg, color: st.text, border: `1px solid ${st.border}` }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#64748b' }}>{u.email}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {u.phone && <span className="text-xs" style={{ color: '#94a3b8' }}>{u.phone}</span>}
                      <span className="text-xs" style={{ color: '#94a3b8' }}>
                        Joined {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {u.verificationDocuments?.idDocument && (
                      <a href={u.verificationDocuments.idDocument} target="_blank" rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:opacity-80"
                        style={{ borderColor: '#e2e8f0', color: '#475569' }}>
                        Docs
                      </a>
                    )}
                    {filterStatus === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(u._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#ffffff' }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          Approve
                        </button>
                        <button onClick={() => setSelectedUserId(selectedUserId === u._id ? null : u._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                          style={{ borderColor: '#fecaca', color: '#ef4444', backgroundColor: '#fef2f2' }}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline rejection form */}
                {selectedUserId === u._id && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl p-4 flex flex-col gap-3"
                      style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                      <p className="text-sm font-bold" style={{ color: '#dc2626' }}>Rejection Reason</p>
                      <textarea
                        placeholder="Explain why this verification is being rejected..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none border"
                        style={{ backgroundColor: '#ffffff', borderColor: '#fecaca', color: '#1e293b' }}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(u._id)}
                          className="flex-1 py-2 rounded-xl text-sm font-bold"
                          style={{ backgroundColor: '#ef4444', color: '#ffffff' }}>
                          Confirm Rejection
                        </button>
                        <button onClick={() => { setSelectedUserId(null); setRejectionReason(''); }}
                          className="flex-1 py-2 rounded-xl text-sm font-semibold border"
                          style={{ borderColor: '#e2e8f0', color: '#64748b', backgroundColor: '#f8fafc' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserVerificationPanel;