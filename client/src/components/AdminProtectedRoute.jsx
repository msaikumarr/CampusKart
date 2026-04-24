
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user)        return <Navigate to="/login" replace />;
  if (!user.isAdmin) return <Navigate to="/" replace />;

  return children;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ backgroundColor: '#faf8f4' }}>
      <div className="relative flex items-center justify-center">
        <span className="absolute w-20 h-20 rounded-3xl animate-ping opacity-20"
          style={{ backgroundColor: '#1d4ed8' }} />
        <span className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)' }}>
          <svg className="w-8 h-8" style={{ color: '#faf8f4' }} fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </span>
      </div>
      <p className="text-lg font-extrabold tracking-tight" style={{ color: '#1e293b' }}>
        Campus<span style={{ color: '#1d4ed8' }}>Kart</span>
        <span className="text-sm font-semibold ml-2 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>Admin</span>
      </p>
      <div className="w-40 h-1 rounded-full overflow-hidden" style={{ backgroundColor: '#e2e8f0' }}>
        <div className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa)',
            animation: 'loading-bar 1.4s ease-in-out infinite',
          }} />
      </div>
      <p className="text-xs font-medium" style={{ color: '#94a3b8' }}>Verifying admin access…</p>
      <style>{`
        @keyframes loading-bar {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}