import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Stationery", "Sports", "Lab Equipment", "Cycles", "Other"];
const CONDITIONS  = ["New", "Like New", "Good", "Fair", "Poor"];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold" style={{ color: "#374151" }}>
          {label}{required && <span style={{ color: "#ef4444" }}> *</span>}
        </label>
        {hint && <span className="text-xs" style={{ color: "#94a3b8" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Edit() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();
  const fileRef      = useRef(null);

  const [form, setForm]           = useState(null);        // loaded from API
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [isDirty, setIsDirty]     = useState(false);

  // Load existing item
  useEffect(() => {
    API.get(`/api/items/${id}`)
      .then((res) => {
        const item = res.data;
        // Guard: only owner can edit
        const ownerId = item.createdBy?._id || item.createdBy;
        if (user && ownerId?.toString() !== user._id?.toString()) {
          setUnauthorized(true);
          return;
        }
        setForm({
          title:         item.title         || "",
          description:   item.description   || "",
          price:         item.price         ?? "",  
          originalPrice: item.originalPrice ?? "",
          category:      item.category      || "",
          condition:     item.condition     || "",
          location:      item.location      || "",
        });
        setPreview(item.image || null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id, user]);

  const set = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setIsDirty(true);
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const removeImage = () => {
    setImageFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim())                                   return setError("Title is required.");
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) return setError("Enter a valid price.");
    if (!form.category)                                       return setError("Please select a category.");

    setError("");
    setSaving(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== "" && v != null) data.append(k, v); });
      if (imageFile) data.append("image", imageFile);
      await API.put(`/api/items/${id}`, data);
      setSuccess(true);
      setIsDirty(false);
      setTimeout(() => navigate(`/item/${id}`), 1600);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ── Input helpers ── */
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200";
  const inputStyle = { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" };
  const focusH = {
    onFocus: e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; },
    onBlur:  e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; },
  };

  const discount = form?.price && form?.originalPrice && Number(form.originalPrice) > Number(form.price)
    ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
    : null;

  /* ── States ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8f4" }}>
      <div className="flex flex-col items-center gap-3">
        <svg className="w-8 h-8 animate-spin" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "#64748b" }}>Loading listing…</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "#faf8f4" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
        <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="font-bold text-lg" style={{ color: "#1e293b" }}>Listing not found</p>
      <Link to="/products" className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>← Back to listings</Link>
    </div>
  );

  if (unauthorized) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: "#faf8f4" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#fef2f2" }}>
        <svg className="w-8 h-8" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <p className="font-bold text-lg" style={{ color: "#1e293b" }}>Not authorised</p>
      <p className="text-sm" style={{ color: "#64748b" }}>You can only edit your own listings.</p>
      <Link to="/products" className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>← Back to listings</Link>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8f4" }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
          <svg className="w-10 h-10" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#1e293b" }}>Changes Saved!</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>Redirecting to your listing…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* ── Header ── */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm mb-0.5" style={{ color: "#94a3b8" }}>
              <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <Link to={`/item/${id}`} className="hover:text-blue-600 transition-colors truncate max-w-35">{form?.title || "Item"}</Link>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              <span style={{ color: "#475569" }}>Edit</span>
            </div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>Edit Listing</h1>
          </div>

          {/* Unsaved indicator */}
          {isDirty && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: "#fefce8", border: "1px solid #fde68a", color: "#d97706" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              Unsaved changes
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Image ── */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#1e293b" }}>Product Image</p>

            {!preview ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-12 cursor-pointer transition-all duration-200"
                style={{ borderColor: dragOver ? "#1d4ed8" : "#cbd5e1", backgroundColor: dragOver ? "#eff6ff" : "#f8fafc" }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#eff6ff" }}>
                  <svg className="w-6 h-6" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                    Drag & drop or <span style={{ color: "#1d4ed8" }}>click to upload</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>PNG, JPG, WEBP up to 10MB</p>
                </div>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
                <img src={preview} alt="Preview" className="w-full h-56 object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200"
                  style={{ backgroundColor: "rgba(15,23,42,0.45)" }}>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: "#faf8f4", color: "#1d4ed8" }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Replace
                  </button>
                  <button type="button" onClick={removeImage}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold"
                    style={{ backgroundColor: "#fef2f2", color: "#ef4444" }}>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Remove
                  </button>
                </div>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {/* ── Basic details ── */}
          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold" style={{ color: "#1e293b" }}>Basic Details</p>

            <Field label="Title" required>
              <input type="text" value={form.title} maxLength={80}
                onChange={(e) => set("title", e.target.value)}
                className={inputClass} style={inputStyle} {...focusH} />
              <p className="text-right text-xs mt-1" style={{ color: "#94a3b8" }}>{form.title.length}/80</p>
            </Field>

            <Field label="Description" hint="Optional">
              <textarea value={form.description} rows={3} maxLength={500}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe condition, edition, reason for selling..."
                className={`${inputClass} resize-none`} style={inputStyle} {...focusH} />
              <p className="text-right text-xs mt-1" style={{ color: "#94a3b8" }}>{form.description.length}/500</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, appearance: "none" }} {...focusH}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Condition">
                <select value={form.condition} onChange={(e) => set("condition", e.target.value)}
                  className={inputClass} style={{ ...inputStyle, appearance: "none" }} {...focusH}>
                  <option value="">Select…</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Pricing ── */}
          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold" style={{ color: "#1e293b" }}>Pricing</p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Selling Price (₹)" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#94a3b8" }}>₹</span>
                  <input type="number" min="0" value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    className={`${inputClass} pl-8`} style={inputStyle} {...focusH} />
                </div>
              </Field>

              <Field label="Original Price (₹)" hint="Optional">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#94a3b8" }}>₹</span>
                  <input type="number" min="0" value={form.originalPrice}
                    onChange={(e) => set("originalPrice", e.target.value)}
                    className={`${inputClass} pl-8`} style={inputStyle} {...focusH} />
                </div>
              </Field>
            </div>

            {discount && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>
                  {discount}% discount — buyers will love this deal!
                </p>
              </div>
            )}
          </div>

          {/* ── Location ── */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <Field label="Pickup Location" hint="Optional">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input type="text" value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="e.g. Library Block, Hostel A entrance..."
                  className={`${inputClass} pl-10`} style={inputStyle} {...focusH} />
              </div>
            </Field>
          </div>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <Link to={`/item/${id}`}
              className="flex-1 flex items-center justify-center py-3.5 rounded-2xl text-sm font-bold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "#e2e8f0", color: "#64748b", backgroundColor: "#ffffff" }}>
              Cancel
            </Link>

            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
              style={{
                background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)",
                color: "#faf8f4",
                boxShadow: "0 4px 18px rgba(29,78,216,0.3)",
              }}>
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}