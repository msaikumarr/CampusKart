import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import API from "../utils/api";
import ItemCard from "../components/ItemCard";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  { label: "Books",         bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",   hover: "hover:bg-blue-100" },
  { label: "Electronics",  bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-700", hover: "hover:bg-indigo-100" },
  { label: "Furniture",    bg: "bg-sky-50",     border: "border-sky-200",    text: "text-sky-700",    hover: "hover:bg-sky-100" },
  { label: "Clothing",     bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",   hover: "hover:bg-blue-100" },
  { label: "Stationery",   bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-700", hover: "hover:bg-indigo-100" },
  { label: "Sports",       bg: "bg-sky-50",     border: "border-sky-200",    text: "text-sky-700",    hover: "hover:bg-sky-100" },
  { label: "Lab Equipment",bg: "bg-blue-50",    border: "border-blue-200",   text: "text-blue-700",   hover: "hover:bg-blue-100" },
  { label: "Cycles",       bg: "bg-indigo-50",  border: "border-indigo-200", text: "text-indigo-700", hover: "hover:bg-indigo-100" },
];

const STATS = [
  { value: "12K+",  label: "Students" },
  { value: "4.8K+", label: "Listings" },
  { value: "98%",   label: "Satisfaction" },
  { value: "50+",   label: "Colleges" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse or Search",
    desc: "Explore thousands of student listings across categories — or search for exactly what you need.",
  },
  {
    step: "02",
    title: "Connect Instantly",
    desc: "Message the seller directly. No middlemen, no delays — just campus-to-campus.",
  },
  {
    step: "03",
    title: "Meet & Deal",
    desc: "Meet safely on campus, inspect the item, and hand over cash. Simple and secure.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recent");
  const { user } = useAuth();

  useEffect(() => {
    if (user?.isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    API.get("/api/items")
      .then((res) => setItems(res.data))
      .finally(() => setLoading(false));
  }, []);

  const featured = items.slice(0, 8);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#faf8f4" }}>

      {/* Welcome message for logged-in users */}
      {user && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Welcome back, {user.username}!</p>
                <p className="text-xs text-blue-700">Ready to buy or sell on CampusKart?</p>
              </div>
            </div>
            {/* <Link
              to="/sell"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + Sell Item
            </Link> */}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4" style={{ background: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)" }}>
        {/* Cream blobs */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ backgroundColor: "#faf8f4", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ backgroundColor: "#faf8f4", transform: "translate(-30%, 30%)" }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />

        {/* Floating text badges */}
        <div className="absolute top-10 left-[7%] hidden lg:flex items-center gap-2 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full animate-bounce" style={{ animationDuration: "3.2s", backgroundColor: "rgba(255,255,255,0.12)" }}>
          Sell old books
        </div>
        <div className="absolute top-20 right-[8%] hidden lg:flex items-center gap-2 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.8s", backgroundColor: "rgba(255,255,255,0.12)" }}>
          Buy electronics
        </div>
        <div className="absolute bottom-16 left-[10%] hidden lg:flex items-center gap-2 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold px-4 py-2 rounded-full animate-bounce" style={{ animationDuration: "3.6s", animationDelay: "0.4s", backgroundColor: "rgba(255,255,255,0.12)" }}>
          Rent cycles
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Live badge */}
          <div className="inline-flex items-center gap-2 border border-white/25 text-white/90 text-xs font-semibold px-4 py-1.5 rounded-full mb-7" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
            India's #1 Campus Marketplace
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-5 tracking-tight" style={{ color: "#faf8f4" }}>
            Buy &amp; Sell on Campus
            <br />
            <span style={{ color: "rgba(250,248,244,0.72)" }}>The Smart Way</span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl mx-auto mb-9 leading-relaxed" style={{ color: "rgba(250,248,244,0.75)" }}>
            Trade textbooks, electronics, furniture and more — exclusively with students from your college. Safe, fast &amp; free.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm"
              style={{ backgroundColor: "#faf8f4", color: "#1d4ed8" }}
            >
              Browse Listings
            </Link>
            <Link
              to="/sell"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border font-bold rounded-2xl transition-all duration-200 text-sm"
              style={{ backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.3)", color: "#faf8f4" }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)"}
            >
              Start Selling
            </Link>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 52" className="w-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,52 C480,0 960,0 1440,52 L1440,52 L0,52 Z" fill="#faf8f4" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS
      ══════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-10">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center p-5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
            >
              <span className="text-2xl font-extrabold" style={{ color: "#1d4ed8" }}>{s.value}</span>
              <span className="text-xs font-semibold mt-1" style={{ color: "#64748b" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CATEGORIES
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>Shop by Category</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Find exactly what you need</p>
          </div>
          <Link to="/products" className="text-sm font-semibold flex items-center gap-1 transition-colors" style={{ color: "#1d4ed8" }}>
            All categories
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.label}
              to={`/products?category=${cat.label.toLowerCase().replace(" ", "-")}`}
              className={`flex flex-col items-center justify-center gap-1.5 py-5 px-2 rounded-2xl border text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cat.bg} ${cat.border} ${cat.text} ${cat.hover}`}
            >
              <span className="text-sm font-bold leading-tight">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PROMO BANNER
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-5"
          style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: "#faf8f4" }} />
          <div className="absolute -right-2 -bottom-10 w-28 h-28 rounded-full opacity-10" style={{ backgroundColor: "#faf8f4" }} />

          <div className="relative z-10">
            <span className="text-xs font-bold tracking-widest uppercase mb-1 block" style={{ color: "#93c5fd" }}>Limited Offer</span>
            <h3 className="text-xl sm:text-2xl font-extrabold" style={{ color: "#faf8f4" }}>List your first item for free</h3>
            <p className="text-sm mt-1" style={{ color: "rgba(250,248,244,0.65)" }}>Zero commission. Just post, connect &amp; sell.</p>
          </div>
          <Link
            to="/sell"
            className="relative z-10 shrink-0 px-7 py-3 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
            style={{ backgroundColor: "#faf8f4", color: "#1d4ed8" }}
          >
            Post Now — It's Free
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED LISTINGS
      ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>Featured Listings</h2>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Fresh picks from your campus</p>
          </div>

          {/* Tabs */}
          <div className="flex items-center rounded-xl p-1 gap-1 self-start sm:self-auto" style={{ backgroundColor: "#e8e4dc" }}>
            {["recent", "popular", "deals"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-200"
                style={
                  activeTab === tab
                    ? { backgroundColor: "#1d4ed8", color: "#faf8f4", boxShadow: "0 1px 4px rgba(29,78,216,0.25)" }
                    : { backgroundColor: "transparent", color: "#64748b" }
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse overflow-hidden" style={{ backgroundColor: "#e8e4dc" }}>
                <div className="h-44" style={{ backgroundColor: "#d4cfc6" }} />
                <div className="p-4 space-y-2">
                  <div className="h-3 rounded w-3/4" style={{ backgroundColor: "#d4cfc6" }} />
                  <div className="h-3 rounded w-1/2" style={{ backgroundColor: "#d4cfc6" }} />
                  <div className="h-4 rounded w-1/3 mt-2" style={{ backgroundColor: "#d4cfc6" }} />
                </div>
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {featured.map((item) => (
              <ItemCard key={item._id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20" style={{ color: "#94a3b8" }}>
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "#dbeafe" }}>
              <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="font-semibold" style={{ color: "#475569" }}>No listings yet.</p>
            <p className="text-sm mt-1">Be the first to post something!</p>
            <Link
              to="/sell"x
              className="mt-5 inline-block px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
              style={{ backgroundColor: "#1d4ed8", color: "#faf8f4" }}
            >
              Post a listing
            </Link>
          </div>
        )}

        {featured.length > 0 && (
          <div className="mt-9 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl border-2 font-bold text-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}
            >
              View all listings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>How CampusKart Works</h2>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>3 simple steps to buy or sell</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-[33%] right-[33%] h-px" style={{ background: "linear-gradient(to right, #bfdbfe, #2563eb, #bfdbfe)" }} />

            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-7 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg relative"
                style={{ backgroundColor: "#faf8f4", borderColor: "#e2e8f0" }}
              >
                {/* Step number circle */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold mb-5 relative z-10"
                  style={{ backgroundColor: "#1d4ed8", color: "#faf8f4" }}
                >
                  {step.step}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "#1e293b" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          SELL CTA
      ══════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{ backgroundColor: "#dbeafe" }}
        >
          <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#1e293b" }}>
          Got something to sell?
        </h2>
        <p className="text-base max-w-md mx-auto mb-8" style={{ color: "#64748b" }}>
          Post in 60 seconds — no fees, no hassle. Reach thousands of students on your campus right now.
        </p>
        <Link
          to="/sell"
          className="inline-flex items-center gap-2 px-10 py-4 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-sm"
          style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)", color: "#faf8f4" }}
        >
          Create a Listing
        </Link>
      </section>

      {/* ══════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════ */}
      <footer style={{ backgroundColor: "#0f172a" }}>
        {/* Top grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <span
                className="flex items-center justify-center w-9 h-9 rounded-xl"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)" }}
              >
                <svg className="w-5 h-5" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </span>
              <span className="text-lg font-extrabold tracking-tight" style={{ color: "#faf8f4" }}>
                Campus<span style={{ color: "#60a5fa" }}>Kart</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#94a3b8" }}>
              India's trusted campus marketplace. Buy, sell and trade within your college community — safely and for free.
            </p>
            {/* Social links */}
            <div className="flex gap-3">
              {[
                { label: "Twitter/X", to: "/contact", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.25 2.25h6.988l4.26 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "Instagram", to: "/faq", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" },
                { label: "LinkedIn", to: "/about", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map((s) => (
                <Link
                  key={s.label}
                  to={s.to}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{ backgroundColor: "#1e293b" }}
                >
                  <svg className="w-3.5 h-3.5" style={{ color: "#94a3b8" }} fill="currentColor" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                </Link>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#60a5fa" }}>Explore</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Browse Products", to: "/products" },
                { label: "Categories", to: "/products" },
                { label: "New Arrivals", to: "/products" },
                { label: "Top Deals", to: "/products" },
                { label: "Sell an Item", to: "/sell" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm transition-colors duration-150 hover:text-white" style={{ color: "#94a3b8" }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#60a5fa" }}>Company</h4>
            <ul className="space-y-2.5">
              {[
                { label: "About Us",     to: "/about" },
                { label: "Contact",      to: "/contact" },
                { label: "Privacy Policy", to: "/privacy" },
                { label: "Terms of Use",  to: "/terms" },
                { label: "Help & FAQ",   to: "/faq" },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm transition-colors duration-150 hover:text-white" style={{ color: "#94a3b8" }}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "#60a5fa" }}>Stay Updated</h4>
            <p className="text-sm mb-4" style={{ color: "#94a3b8" }}>Get notified when new items drop on your campus.</p>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none border transition-colors duration-200 focus:border-blue-500"
                style={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#e2e8f0" }}
              />
              <button
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "#faf8f4" }}
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: "1px solid #1e293b" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "#475569" }}>
              © {new Date().getFullYear()} CampusKart. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "#475569" }}>
              Made with ♥ for students across India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}