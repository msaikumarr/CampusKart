import { useState } from "react";
import API, { API_BASE_URL } from "../utils/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

function InputWrapper({ label, icon, children, hint }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {icon}
        </span>
        {children}
      </div>
      {hint && <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>{hint}</p>}
    </div>
  );
}

const COLLEGE_EMAIL_SUFFIXES = ['.edu', '.edu.in', '.ac.in', '.ac.uk'];

function isCollegeEmail(email) {
  const domain = (email || '').trim().toLowerCase().split('@')[1] || '';
  return COLLEGE_EMAIL_SUFFIXES.some((suffix) => domain === suffix.slice(1) || domain.endsWith(suffix));
}

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [idDocument, setIdDocument] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  /* ── Password strength ── */
  const getStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    const map = [
      { label: "Too short",  color: "#ef4444" },
      { label: "Weak",       color: "#f97316" },
      { label: "Fair",       color: "#eab308" },
      { label: "Good",       color: "#3b82f6" },
      { label: "Strong",     color: "#22c55e" },
    ];
    return { score, ...map[score] };
  };

  const strength = getStrength(form.password);
  const passwordsMatch = form.confirmPassword && form.password === form.confirmPassword;
  const passwordsMismatch = form.confirmPassword && form.password !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isCollegeEmail(form.email)) {
      setError("Please use a college email address such as .edu, .edu.in, .ac.in, or a domain approved by your campus.");
      return;
    }

    if (!idDocument) {
      setError("Please upload your student ID card.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms & Privacy Policy.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("idDocument", idDocument);

      await API.post("/api/auth/signup", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Account created! Admin verification is required before you can sell.");
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full pl-10 pr-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200";
  const inputStyle = { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" };
  const focusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; },
    onBlur:  (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; },
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#faf8f4" }}>

      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: "#faf8f4" }} />
        <div className="absolute top-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ backgroundColor: "#faf8f4" }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ backgroundColor: "rgba(250,248,244,0.15)" }}>
            <svg className="w-5 h-5" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: "#faf8f4" }}>
            Campus<span style={{ color: "#93c5fd" }}>Kart</span>
          </span>
        </div>

        {/* Center copy */}
        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold leading-snug mb-4" style={{ color: "#faf8f4" }}>
            Join thousands of<br />campus traders.
          </h2>
          <p className="text-base leading-relaxed max-w-sm mb-8" style={{ color: "rgba(250,248,244,0.7)" }}>
            Create your free account and start buying or selling within your college community today.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "12K+", label: "Students" },
              { value: "Free", label: "To join" },
              { value: "50+", label: "Colleges" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-2xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                <div className="text-xl font-extrabold" style={{ color: "#faf8f4" }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(250,248,244,0.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "rgba(250,248,244,0.4)" }}>
          © {new Date().getFullYear()} CampusKart — Made for students
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-10 overflow-y-auto">

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}>
            <svg className="w-5 h-5" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </span>
          <span className="text-xl font-extrabold tracking-tight" style={{ color: "#1e293b" }}>
            Campus<span style={{ color: "#1d4ed8" }}>Kart</span>
          </span>
        </div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-3xl font-extrabold mb-1.5" style={{ color: "#1e293b" }}>Create account</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>Join your campus marketplace — free forever.</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 text-sm font-medium"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <InputWrapper
              label="Full Name"
              icon={<svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
            >
              <input
                type="text"
                required
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                style={inputStyle}
                {...focusHandlers}
              />
            </InputWrapper>

            {/* Email */}
            <InputWrapper
              label="Email address"
              icon={<svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
              hint="Accepted: .edu, .edu.in, .ac.in, or your campus-approved domain"
            >
              <input
                type="email"
                required
                placeholder="you@college.edu"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                style={inputStyle}
                {...focusHandlers}
              />
            </InputWrapper>

            {/* Student ID */}
            <InputWrapper
              label="Student ID card"
              icon={<svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10M7 11h10M7 15h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>}
              hint="Upload clear photo/PDF of your college ID. Required for admin verification."
            >
              <input
                type="file"
                required
                accept="image/*,.pdf"
                onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                className={`${inputClass} file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold`}
                style={inputStyle}
              />
            </InputWrapper>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={`${inputClass} pr-11`}
                  style={inputStyle}
                  {...focusHandlers}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#1d4ed8"}
                  onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                >
                  {showPassword
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i <= strength.score ? strength.color : "#e2e8f0" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className={`${inputClass} pr-11`}
                  style={{
                    ...inputStyle,
                    borderColor: passwordsMismatch ? "#fca5a5" : passwordsMatch ? "#86efac" : "#e2e8f0",
                  }}
                  onFocus={e => { e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; }}
                  onBlur={e => { e.target.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#94a3b8" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#1d4ed8"}
                  onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                >
                  {showConfirm
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  }
                </button>

                {/* Match indicator */}
                {form.confirmPassword && (
                  <span className="absolute right-9 top-1/2 -translate-y-1/2 mr-1">
                    {passwordsMatch
                      ? <svg className="w-4 h-4" style={{ color: "#22c55e" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      : <svg className="w-4 h-4" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    }
                  </span>
                )}
              </div>
              {passwordsMismatch && (
                <p className="mt-1 text-xs" style={{ color: "#ef4444" }}>Passwords do not match</p>
              )}
            </div>

            {/* Agree to Terms */}
            <div className="flex items-start gap-3 pt-1">
              <button
                type="button"
                onClick={() => setAgreed(v => !v)}
                className="relative mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  borderColor: agreed ? "#1d4ed8" : "#cbd5e1",
                  backgroundColor: agreed ? "#1d4ed8" : "#ffffff",
                }}
                aria-checked={agreed}
                role="checkbox"
              >
                {agreed && (
                  <svg className="w-3 h-3" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
                I agree to the{" "}
                <Link to="/terms" className="font-semibold hover:underline" style={{ color: "#1d4ed8" }}>Terms of Service</Link>
                {" "}and{" "}
                <Link to="/privacy" className="font-semibold hover:underline" style={{ color: "#1d4ed8" }}>Privacy Policy</Link>
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-3.5 rounded-xl text-sm font-bold mt-1 flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
                color: "#faf8f4",
                boxShadow: "0 4px 14px rgba(29,78,216,0.35)",
              }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </>
              ) : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f0" }} />
            <span className="text-xs font-medium" style={{ color: "#94a3b8" }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#e2e8f0" }} />
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#cbd5e1"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#e2e8f0"}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Login link */}
          <p className="mt-7 text-center text-sm" style={{ color: "#64748b" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-bold transition-colors hover:underline" style={{ color: "#1d4ed8" }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}