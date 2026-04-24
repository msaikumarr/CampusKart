import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["Books", "Electronics", "Furniture", "Clothing", "Stationery", "Sports", "Lab Equipment", "Cycles", "Other"];
const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-semibold" style={{ color: "#374151" }}>
          {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
        </label>
        {hint && <span className="text-xs" style={{ color: "#94a3b8" }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function Sell() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "", description: "", price: "", originalPrice: "",
    category: "", condition: "", location: "",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);
  const [locationMode, setLocationMode] = useState("manual"); // "manual", "live", "default"
  const [locationLoading, setLocationLoading] = useState(false);

  const canSell = Boolean(user?.isAdmin || user?.isVerified);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    if (!name) return;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? value : value,
    }));
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`;
          setForm((prev) => ({
            ...prev,
            location: address,
          }));
          setLocationMode("live");
        } catch {
          setForm((prev) => ({
            ...prev,
            location: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
          }));
          setLocationMode("live");
          setError("Unable to fetch address, using coordinates.");
        } finally {
          setLocationLoading(false);
        }
      },
      () => {
        setError("Unable to retrieve your location. Please check permissions.");
        setLocationLoading(false);
      }
    );
  };

  const setDefaultLocation = () => {
    setForm((prev) => ({
      ...prev,
      location: "Campus Main Entrance",
    }));
    setLocationMode("default");
  };

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSell) {
      return setError("Your seller account is pending admin verification. You can post items after approval.");
    }
    if (!form.title.trim()) return setError("Title is required.");
    if (!form.price || isNaN(form.price) || Number(form.price) < 0) return setError("Enter a valid price.");
    if (!form.category) return setError("Please select a category.");

    setError("");
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => v && data.append(k, v));
      if (image) data.append("image", image);
      await API.post("/api/items", data);
      setSuccess(true);
      setTimeout(() => navigate("/products"), 1800);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to post item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b",
  };
  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200";
  const focusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; },
    onBlur:  (e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; },
  };

  /* ── Success screen ── */
  if (success) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#faf8f4" }}>
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
          <svg className="w-10 h-10" style={{ color: "#faf8f4" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-2" style={{ color: "#1e293b" }}>Item Posted!</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>Redirecting you to listings…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <h1 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>Post a Listing</h1>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Fill in the details to sell your item on campus</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {!canSell && (
          <div
            className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div>
              <p className="font-semibold">Seller approval required</p>
              <p className="mt-0.5 text-xs">
                Your account is {user?.verificationStatus || "pending"}. Admin approval is required before posting items.
              </p>
            </div>
          </div>
        )}

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

          {/* ── Section 1: Image upload ── */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#1e293b" }}>
              Product Image
            </p>

            {!preview ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-12 cursor-pointer transition-all duration-200"
                style={{
                  borderColor: dragOver ? "#1d4ed8" : "#cbd5e1",
                  backgroundColor: dragOver ? "#eff6ff" : "#f8fafc",
                }}
              >
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "#eff6ff" }}>
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
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                  style={{ backgroundColor: "rgba(15,23,42,0.6)" }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs font-medium text-white truncate"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}>
                  {image?.name}
                </div>
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files[0])} />
          </div>

          {/* ── Section 2: Basic info ── */}
          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold" style={{ color: "#1e293b" }}>Basic Details</p>

            <Field label="Title" required>
              <input type="text" name="title" placeholder="e.g. Engineering Maths Textbook Vol 2"
                value={form.title ?? ""}
                onChange={handleChange}
                maxLength={80}
                className={inputClass} style={inputStyle} {...focusHandlers} />
              <p className="text-right text-xs mt-1" style={{ color: "#94a3b8" }}>{form.title.length}/80</p>
            </Field>

            <Field label="Description" hint="Optional">
              <textarea
                name="description"
                placeholder="Describe the condition, edition, reason for selling..."
                value={form.description ?? ""}
                onChange={handleChange}
                rows={3} maxLength={500}
                className={`${inputClass} resize-none`} style={inputStyle} {...focusHandlers} />
              <p className="text-right text-xs mt-1" style={{ color: "#94a3b8" }}>{form.description.length}/500</p>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Category" required>
                <select name="category" value={form.category ?? ""} onChange={handleChange}
                  className={inputClass} style={{ ...inputStyle, appearance: "none" }} {...focusHandlers}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Condition" required>
                <select name="condition" value={form.condition ?? ""} onChange={handleChange}
                  className={inputClass} style={{ ...inputStyle, appearance: "none" }} {...focusHandlers}>
                  <option value="">Select…</option>
                  {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
            </div>
          </div>

          {/* ── Section 3: Pricing ── */}
          <div className="rounded-2xl border p-5 flex flex-col gap-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <p className="text-sm font-bold" style={{ color: "#1e293b" }}>Pricing</p>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Selling Price (₹)" required>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#94a3b8" }}>₹</span>
                  <input type="number" min="0" placeholder="0"
                  name="price"
                  value={form.price ?? ""}
                  onChange={handleChange}
                  inputMode="decimal"
                  className={`${inputClass} pl-8`} style={inputStyle} {...focusHandlers} />
                </div>
              </Field>

              <Field label="Original Price (₹)" hint="Optional">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: "#94a3b8" }}>₹</span>
                  <input type="number" min="0" placeholder="0"
                  name="originalPrice"
                  value={form.originalPrice ?? ""}
                  onChange={handleChange}
                  inputMode="decimal"
                  className={`${inputClass} pl-8`} style={inputStyle} {...focusHandlers} />
                </div>
              </Field>
            </div>

            {/* Discount preview */}
            {form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
                style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <svg className="w-4 h-4 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>
                  {Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)}% discount — buyers will love this deal!
                </p>
              </div>
            )}
          </div>

          {/* ── Section 4: Location ── */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <Field label="Pickup Location" hint="Optional">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLocationMode("manual")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      locationMode === "manual"
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    }`}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      locationMode === "live"
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    } disabled:opacity-50`}
                  >
                    {locationLoading ? "Getting..." : "Use Current Location"}
                  </button>
                  <button
                    type="button"
                    onClick={setDefaultLocation}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      locationMode === "default"
                        ? "bg-blue-100 text-blue-700 border border-blue-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                    }`}
                  >
                    Use Default
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <svg className="w-4 h-4" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="location"
                    placeholder="e.g. Library Block, Hostel A entrance..."
                    value={form.location ?? ""}
                    onChange={handleChange}
                    readOnly={locationMode !== "manual"}
                    className={`${inputClass} pl-10 ${locationMode !== "manual" ? "bg-gray-50" : ""}`}
                    style={inputStyle}
                    {...(locationMode === "manual" ? focusHandlers : {})}
                  />
                </div>
              </div>
            </Field>
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading || !canSell}
            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            style={{
              background: "linear-gradient(135deg,#1d4ed8 0%,#2563eb 100%)",
              color: "#faf8f4",
              boxShadow: "0 4px 18px rgba(29,78,216,0.35)",
            }}
          >
            {!canSell ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
                </svg>
                Awaiting Admin Verification
              </>
            ) : loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Posting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Post Listing
              </>
            )}
          </button>

          {/* Tips footer */}
          <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-2xl"
            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}>
            <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs leading-relaxed" style={{ color: "#1d4ed8" }}>
              <span className="font-bold">Tip:</span> Clear photos and honest descriptions get 3× more responses. Add the original price to show buyers how much they're saving!
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 