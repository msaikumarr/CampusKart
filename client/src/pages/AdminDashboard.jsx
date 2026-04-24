import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import UserVerificationPanel from "../components/AdminComponents/UserVerificationPanel";
import DashboardStats from "../components/AdminComponents/DashboardStats";
import OrderTrackingPanel from "../components/AdminComponents/OrderTrackingPanel";

const TABS = [
  {
    key: 'stats',
    label: 'Statistics',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'users',
    label: 'User Verification',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
      </svg>
    ),
  },
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats');
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/admin/stats`, { withCredentials: true });
      setStats(res.data.stats);
      setError('');   
    } catch {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#faf8f4' }}>

      {/* ── Top Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#93c5fd' }}>
                Admin Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: '#faf8f4' }}>
              CampusKart Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(250,248,244,0.7)' }}>
              Verify users and monitor account validation activity
            </p>
          </div>

          {/* Refresh + logo */}
          <div className="flex items-center gap-3">
            <button onClick={fetchStats}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)', color: '#faf8f4' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <svg className="w-5 h-5" style={{ color: '#faf8f4' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {TABS.map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all duration-200 border-b-2"
                style={{
                  color: activeTab === tab.key ? '#faf8f4' : 'rgba(250,248,244,0.55)',
                  borderBottomColor: activeTab === tab.key ? '#faf8f4' : 'transparent',
                  backgroundColor: 'transparent',
                }}>
                {tab.icon}
                <span className="hidden sm:block">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm font-medium"
            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' }}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        {activeTab === 'stats' && <DashboardStats stats={stats} loading={loading} onRefresh={fetchStats} />}
        {activeTab === 'users' && <UserVerificationPanel />}
        {activeTab === 'orders' && <OrderTrackingPanel />}
      </div>
    </div>
  );
};

export default AdminDashboard;