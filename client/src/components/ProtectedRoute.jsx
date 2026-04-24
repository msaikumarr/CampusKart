import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}

function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ backgroundColor: "#faf8f4" }}
    >
      {/* Animated logo */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <span
          className="absolute w-20 h-20 rounded-3xl animate-ping opacity-20"
          style={{ backgroundColor: "#1d4ed8" }}
        />
        {/* Logo tile */}
        <span
          className="relative flex items-center justify-center w-16 h-16 rounded-2xl shadow-xl"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: "#faf8f4" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </span>
      </div>

      {/* Brand name */}
      <p className="text-lg font-extrabold tracking-tight" style={{ color: "#1e293b" }}>
        Campus<span style={{ color: "#1d4ed8" }}>Kart</span>
      </p>

      {/* Animated bar */}
      <div
        className="w-40 h-1 rounded-full overflow-hidden"
        style={{ backgroundColor: "#e2e8f0" }}
      >
        <div
          className="h-full rounded-full animate-pulse"
          style={{
            background: "linear-gradient(90deg, #1d4ed8, #2563eb, #60a5fa)",
            animation: "loading-bar 1.4s ease-in-out infinite",
          }}
        />
      </div>

      <p className="text-xs font-medium" style={{ color: "#94a3b8" }}>
        Checking your session…
      </p>

      {/* Keyframe injection */}
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