import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [imgError, setImgError]   = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishLoading, setWishLoading] = useState(false);
  const [toast, setToast]         = useState(null); // { msg, type }
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [buying, setBuying]       = useState(false);

  useEffect(() => {
    API.get(`/api/items/${id}`)
      .then((res) => setItem(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToWishlist = async () => {
    setWishLoading(true);
    try {
      await API.post("/api/wishlist", { itemId: id });
      setWishlisted(true);
      showToast("Added to wishlist!");
    } catch {
      showToast("Failed to add to wishlist.", "error");
    } finally {
      setWishLoading(false);
    }
  };

  const deleteItem = async () => {
    setDeleting(true);
    try {
      await API.delete(`/api/items/${id}`);
      navigate("/products");
    } catch {
      showToast("Failed to delete item.", "error");
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const startChat = async () => {
    try {
      await API.post('/api/chat/start', { itemId: id });
      navigate('/chat');
    } catch {
      showToast('Error starting chat.', 'error');
    }
  };

  const buyItem = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setBuying(true);
    try {
      await API.post('/api/orders', { itemId: id });
      showToast('Order placed successfully!');
      navigate('/profile?tab=Orders');
    } catch {
      showToast('Error initiating purchase.', 'error');
      setBuying(false);
    }
  };

  const isOwner = user && item && item.createdBy && item.createdBy._id === user._id;

  /* ── Loading skeleton ── */
  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-pulse">
        <div className="h-4 w-32 rounded mb-6" style={{ backgroundColor: "#e2e8f0" }} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-2xl h-80" style={{ backgroundColor: "#e2e8f0" }} />
          <div className="space-y-4">
            <div className="h-5 w-24 rounded" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="h-8 w-3/4 rounded" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="h-10 w-1/3 rounded" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="h-4 w-full rounded" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="h-4 w-5/6 rounded" style={{ backgroundColor: "#e2e8f0" }} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!item) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: "#faf8f4" }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#dbeafe" }}>
        <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="font-bold text-lg" style={{ color: "#1e293b" }}>Item not found</p>
      <Link to="/products" className="mt-4 text-sm font-semibold" style={{ color: "#1d4ed8" }}>← Back to listings</Link>
    </div>
  );

  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all duration-300"
          style={toast.type === "error"
            ? { backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }
            : { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}
        >
          {toast.type === "error"
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm mb-6" style={{ color: "#94a3b8" }}>
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <Link to="/products" className="hover:text-blue-600 transition-colors">Products</Link>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="truncate max-w-45 font-medium" style={{ color: "#475569" }}>{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Image panel ── */}
          <div>
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
            >
              {item.image && !imgError ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-80 sm:h-96 object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-80 sm:h-96 flex items-center justify-center">
                  <svg className="w-16 h-16" style={{ color: "#cbd5e1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Discount ribbon */}
              {discount && (
                <div
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-xl text-xs font-extrabold"
                  style={{ backgroundColor: "#1d4ed8", color: "#faf8f4" }}
                >
                  {discount}% OFF
                </div>
              )}
            </div>

            {/* Posted by card */}
            {item.createdBy && (
              <div
                className="mt-4 flex items-center gap-3 p-3.5 rounded-2xl border"
                style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  {(item.createdBy.username || item.createdBy.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold" style={{ color: "#1e293b" }}>{item.createdBy.username || "Seller"}</p>
                  <p className="text-xs truncate" style={{ color: "#64748b" }}>{item.createdBy.email}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                  Verified
                </span>
              </div>
            )}
          </div>

          {/* ── Details panel ── */}
          <div className="flex flex-col gap-4">

            {/* Category + condition */}
            <div className="flex flex-wrap gap-2">
              {item.category && (
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                  {item.category}
                </span>
              )}
              {item.condition && (
                <span className="text-xs font-bold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: item.condition === "New" ? "#f0fdf4" : "#fefce8",
                    color: item.condition === "New" ? "#16a34a" : "#ca8a04",
                  }}>
                  {item.condition}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight" style={{ color: "#1e293b" }}>
              {item.title}
            </h1>

            {/* Price block */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price}</span>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-base line-through" style={{ color: "#94a3b8" }}>₹{item.originalPrice}</span>
              )}
            </div>

            {/* Description */}
            {item.description && (
              <div className="rounded-2xl p-4" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Description</p>
                <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{item.description}</p>
              </div>
            )}

            {/* Item details grid */}
            {(item.location || item.postedAt || item.quantity) && (
              <div className="grid grid-cols-2 gap-3">
                {item.location && (
                  <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <svg className="w-4 h-4 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold uppercase" style={{ color: "#94a3b8" }}>Location</p>
                      <p className="text-xs font-semibold" style={{ color: "#1e293b" }}>{item.location}</p>
                    </div>
                  </div>
                )}
                {item.postedAt && (
                  <div className="rounded-xl p-3 flex items-center gap-2" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <svg className="w-4 h-4 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-[10px] font-bold uppercase" style={{ color: "#94a3b8" }}>Posted</p>
                      <p className="text-xs font-semibold" style={{ color: "#1e293b" }}>
                        {new Date(item.postedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA buttons */}
            {!isOwner ? (
              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <button
                  onClick={addToWishlist}
                  disabled={wishLoading || wishlisted}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  style={wishlisted
                    ? { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#ef4444" }
                    : { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" }}
                >
                  <svg className="w-4 h-4" fill={wishlisted ? "#ef4444" : "none"} style={{ color: wishlisted ? "#ef4444" : "#64748b" }} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlisted ? "Wishlisted" : wishLoading ? "Adding…" : "Add to Wishlist"}
                </button>

                <button
                  onClick={buyItem}
                  disabled={buying}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#10b981,#059669)", color: "#faf8f4", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
                  </svg>
                  {buying ? "Processing…" : "Buy Now"}
                </button>

                <button
                  onClick={startChat}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 9c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message Seller
                </button>
              </div>
            ) : (
              /* Owner actions */
              <div className="flex gap-3 mt-2">
                <Link to={`/edit/${item._id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border transition-all hover:-translate-y-0.5"
                  style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Listing
                </Link>

                {!confirmDel ? (
                  <button onClick={() => setConfirmDel(true)}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold border transition-all hover:-translate-y-0.5"
                    style={{ borderColor: "#fecaca", color: "#ef4444", backgroundColor: "#fef2f2" }}>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <button onClick={deleteItem} disabled={deleting}
                      className="flex-1 py-3.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-60"
                      style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                      {deleting ? "Deleting…" : "Confirm Delete"}
                    </button>
                    <button onClick={() => setConfirmDel(false)}
                      className="px-4 rounded-2xl text-sm font-semibold border"
                      style={{ borderColor: "#e2e8f0", color: "#64748b", backgroundColor: "#f8fafc" }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Safety tip */}
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-2xl mt-1"
              style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <svg className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs leading-relaxed" style={{ color: "#1d4ed8" }}>
                <span className="font-bold">Safety tip:</span> Always meet in a public place on campus and inspect the item before paying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}