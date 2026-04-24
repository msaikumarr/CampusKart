import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";

export default function Wishlist() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null); // itemId being removed
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    API.get("/api/wishlist")
      .then((res) => {
        const wishlistItems = res.data.map((entry) => ({
          ...entry.item,
          wishlistId: entry._id,
        }));
        setItems(wishlistItems);
      })
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const removeFromWishlist = async (itemId) => {
    setRemoving(itemId);
    try {
      await API.delete(`/api/wishlist/${itemId}`);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
      showToast("Removed from wishlist.");
    } catch {
      showToast("Failed to remove item.", "error");
    } finally {
      setRemoving(null);
    }
  };

  /* ── Loading skeletons ── */
  if (loading) return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="h-8 w-40 rounded-xl mb-2 animate-pulse" style={{ backgroundColor: "#e2e8f0" }} />
        <div className="h-4 w-28 rounded mb-8 animate-pulse" style={{ backgroundColor: "#e2e8f0" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ backgroundColor: "#e8e4dc" }}>
              <div className="h-44" style={{ backgroundColor: "#d4cfc6" }} />
              <div className="p-4 space-y-2">
                <div className="h-3 rounded w-3/4" style={{ backgroundColor: "#d4cfc6" }} />
                <div className="h-3 rounded w-1/2" style={{ backgroundColor: "#d4cfc6" }} />
                <div className="h-8 rounded-xl mt-3" style={{ backgroundColor: "#d4cfc6" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* ── Toast ── */}
      {toast && (
        <div
          className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold"
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

      {/* ── Header ── */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: "#1e293b" }}>
              <svg className="w-6 h-6" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              My Wishlist
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {items.length} saved item{items.length !== 1 ? "s" : ""}
            </p>
          </div>

          {items.length > 0 && (
            <Link
              to="/products"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:-translate-y-0.5"
              style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Browse More
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Empty state ── */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <svg className="w-10 h-10" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: "#1e293b" }}>Your wishlist is empty</h2>
            <p className="text-sm mb-7 max-w-xs" style={{ color: "#64748b" }}>
              Save items you love and come back to them anytime.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4", boxShadow: "0 4px 14px rgba(29,78,216,0.3)" }}
            >
              Explore Listings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <WishlistCard
                key={item._id}
                item={item}
                removing={removing === item._id}
                onRemove={() => removeFromWishlist(item._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Wishlist Card ── */
function WishlistCard({ item, removing, onRemove }) {
  const [imgError, setImgError] = useState(false);

  const discount = item.originalPrice && item.originalPrice > item.price
    ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
    : null;

  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
    >
      {/* Image */}
      <Link to={`/item/${item._id}`} className="relative block overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
        {item.image && !imgError ? (
          <img
            src={item.image}
            alt={item.title}
            className="w-full h-44 object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-44 flex items-center justify-center">
            <svg className="w-10 h-10" style={{ color: "#cbd5e1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {discount && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: "#1d4ed8", color: "#faf8f4" }}>
            {discount}% OFF
          </span>
        )}

        {/* Category */}
        {item.category && (
          <span className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#1d4ed8" }}>
            {item.category}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/item/${item._id}`}>
          <h2 className="font-bold text-sm line-clamp-2 mb-1 leading-snug" style={{ color: "#1e293b" }}>
            {item.title}
          </h2>
        </Link>

        {/* Price row */}
        <div className="flex items-center gap-2 mt-auto pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
          <span className="text-base font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price ?? "—"}</span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs line-through" style={{ color: "#94a3b8" }}>₹{item.originalPrice}</span>
          )}
          {item.condition && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: item.condition === "New" ? "#f0fdf4" : "#fefce8",
                color: item.condition === "New" ? "#16a34a" : "#ca8a04",
              }}>
              {item.condition}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-3">
          <Link
            to={`/item/${item._id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}
          >
            View Item
          </Link>
          <button
            onClick={onRemove}
            disabled={removing}
            title="Remove from wishlist"
            className="flex items-center justify-center w-10 h-10 rounded-xl border transition-all hover:bg-red-50 disabled:opacity-50"
            style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}
          >
            {removing ? (
              <svg className="w-4 h-4 animate-spin" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}