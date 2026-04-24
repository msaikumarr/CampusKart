import PropTypes from 'prop-types';

const STAT_CARDS = (stats) => [
  {
    title: 'Total Users',
    value: stats.totalUsers ?? 0,
    bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', valueBg: '#dbeafe',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Verified Users',
    value: stats.verifiedUsers ?? 0,
    bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', valueBg: '#dcfce7',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Pending Verification',
    value: stats.pendingVerifications ?? 0,
    bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', valueBg: '#ffedd5',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const DashboardStats = ({ stats, loading, onRefresh }) => {
  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border p-5 animate-pulse"
          style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="h-3 w-28 rounded" style={{ backgroundColor: '#e2e8f0' }} />
            <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: '#e2e8f0' }} />
          </div>
          <div className="h-8 w-20 rounded mt-2" style={{ backgroundColor: '#e2e8f0' }} />
        </div>
      ))}
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: '#fef2f2' }}>
        <svg className="w-8 h-8" style={{ color: '#ef4444' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <p className="font-bold" style={{ color: '#1e293b' }}>Unable to load statistics</p>
      <button onClick={onRefresh}
        className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
        style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}>
        Try Again
      </button>
    </div>
  );

  const cards = STAT_CARDS(stats);

  const verifyRate = stats.totalUsers > 0
    ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold" style={{ color: '#1e293b' }}>Platform Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: '#64748b' }}>Real-time statistics across the platform</p>
        </div>
        <button onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-0.5"
          style={{ borderColor: '#bfdbfe', color: '#1d4ed8', backgroundColor: '#eff6ff' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <div key={i} className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: card.valueBg, color: card.text }}>
              {card.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>
                {card.title}
              </p>
              <p className="text-2xl font-extrabold mt-0.5" style={{ color: '#1e293b' }}>
                {card.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* User verification rate */}
      <div className="grid grid-cols-1 gap-5">
        <div className="rounded-2xl border p-5" style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold" style={{ color: '#1e293b' }}>User Verification Rate</p>
            <span className="text-lg font-extrabold" style={{ color: '#16a34a' }}>{verifyRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#e2e8f0' }}>
            <div className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${verifyRate}%`, background: 'linear-gradient(90deg,#16a34a,#22c55e)' }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: '#94a3b8' }}>{stats.verifiedUsers} verified</span>
            <span className="text-xs" style={{ color: '#94a3b8' }}>{stats.pendingVerifications} pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardStats.propTypes = {
  stats: PropTypes.shape({
    totalUsers: PropTypes.number,
    verifiedUsers: PropTypes.number,
    pendingVerifications: PropTypes.number,
  }),
  loading: PropTypes.bool,
  onRefresh: PropTypes.func,
};

export default DashboardStats;