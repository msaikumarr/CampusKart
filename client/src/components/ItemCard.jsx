import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function ItemCard({ item, viewMode = "grid", isWishlisted = false, onWishlistChange }) {
  const { user } = useAuth();
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [imgError, setImgError]     = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const createdById = typeof item.createdBy === "object" ? item.createdBy?._id : item.createdBy;
  const isOwner = user && createdById === user._id;

  useEffect(() => {
    setWishlisted(isWishlisted);
  }, [isWishlisted]);

  const deleteItem = async () => {
    setDeleting(true);
    try {
      await API.delete(`/api/items/${item._id}`);
      window.location.reload();
    } catch {
      setDeleting(false);
      setConfirmDel(false);
    }
  };

  const toggleWishlist = async (e) => {
    e?.preventDefault();
    if (!user || isOwner || wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await API.delete(`/api/wishlist/${item._id}`);
        setWishlisted(false);
        onWishlistChange?.(item._id, false);
      } else {
        await API.post("/api/wishlist", { itemId: item._id });
        setWishlisted(true);
        onWishlistChange?.(item._id, true);
      }
    } catch {
      // Keep current state on API failure.
    } finally {
      setWishlistLoading(false);
    }
  };

  /* ── LIST VIEW ── */
  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl border p-3 transition-all duration-200 hover:shadow-md group"
        style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
      >
        {/* Thumbnail */}
        <Link to={`/item/${item._id}`} className="shrink-0">
          <div className="w-24 h-20 rounded-xl overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
            {item.image && !imgError ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-7 h-7" style={{ color: "#cbd5e1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <Link to={`/item/${item._id}`} className="flex-1 min-w-0">
          <h2 className="font-bold text-sm truncate" style={{ color: "#1e293b" }}>{item.title}</h2>
          {item.category && (
            <span className="inline-block mt-0.5 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
              {item.category}
            </span>
          )}
          {item.description && (
            <p className="text-xs mt-1 line-clamp-1" style={{ color: "#64748b" }}>{item.description}</p>
          )}
        </Link>

        {/* Price */}
        <div className="shrink-0 text-right">
          <p className="text-base font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price ?? "—"}</p>
          {item.originalPrice && item.originalPrice > item.price && (
            <p className="text-xs line-through" style={{ color: "#94a3b8" }}>₹{item.originalPrice}</p>
          )}
        </div>

        {/* Actions */}
        <div className="shrink-0 flex items-center gap-1.5">
          {isOwner ? (
            <>
              <Link to={`/edit/${item._id}`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}>
                Edit
              </Link>
              {!confirmDel ? (
                <button onClick={() => setConfirmDel(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                  style={{ borderColor: "#fecaca", color: "#ef4444", backgroundColor: "#fef2f2" }}>
                  Delete
                </button>
              ) : (
                <div className="flex gap-1">
                  <button onClick={deleteItem} disabled={deleting}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                    {deleting ? "..." : "Confirm"}
                  </button>
                  <button onClick={() => setConfirmDel(false)}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: "#e2e8f0", color: "#64748b" }}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={toggleWishlist}
              disabled={wishlistLoading}
              className="w-8 h-8 flex items-center justify-center rounded-xl border transition-all duration-200"
              style={wishlisted
                ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
                : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
            >
              <svg className="w-4 h-4 transition-all" fill={wishlisted ? "#ef4444" : "none"}
                style={{ color: wishlisted ? "#ef4444" : "#94a3b8" }}
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── GRID VIEW (default) ── */
  return (
    <div
      className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}
    >
      {/* Image */}
      <Link to={`/item/${item._id}`} className="block relative overflow-hidden"
        style={{ backgroundColor: "#f1f5f9" }}>
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

        {/* Category badge */}
        {item.category && (
          <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#1d4ed8" }}>
            {item.category}
          </span>
        )}

        {/* Wishlist button (non-owner) */}
        {!isOwner && (
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-xl backdrop-blur-sm border transition-all duration-200"
            style={wishlisted
              ? { backgroundColor: "#fef2f2", borderColor: "#fecaca" }
              : { backgroundColor: "rgba(255,255,255,0.85)", borderColor: "rgba(226,232,240,0.7)" }}
          >
            <svg className="w-4 h-4" fill={wishlisted ? "#ef4444" : "none"}
              style={{ color: wishlisted ? "#ef4444" : "#64748b" }}
              viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/item/${item._id}`} className="flex-1">
          <h2 className="font-bold text-sm leading-snug line-clamp-2 mb-1" style={{ color: "#1e293b" }}>
            {item.title}
          </h2>
          {item.description && (
            <p className="text-xs line-clamp-2 mb-2" style={{ color: "#94a3b8" }}>{item.description}</p>
          )}
        </Link>

        {/* Price row */}
        <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: "1px solid #f1f5f9" }}>
          <div>
            <p className="text-base font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price ?? "—"}</p>
            {item.originalPrice && item.originalPrice > item.price && (
              <p className="text-xs line-through" style={{ color: "#94a3b8" }}>₹{item.originalPrice}</p>
            )}
          </div>

          {/* Condition badge */}
          {item.condition && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: item.condition === "New" ? "#f0fdf4" : "#fefce8",
                color: item.condition === "New" ? "#16a34a" : "#ca8a04",
              }}>
              {item.condition}
            </span>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && (
          <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid #f1f5f9" }}>
            {!confirmDel ? (
              <>
                <Link to={`/edit/${item._id}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-90"
                  style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
                <button onClick={() => setConfirmDel(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-90"
                  style={{ borderColor: "#fecaca", color: "#ef4444", backgroundColor: "#fef2f2" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            ) : (
              <div className="flex-1 flex gap-2">
                <button onClick={deleteItem} disabled={deleting}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60"
                  style={{ backgroundColor: "#ef4444", color: "#fff" }}>
                  {deleting ? "Deleting…" : "Confirm?"}
                </button>
                <button onClick={() => setConfirmDel(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                  style={{ borderColor: "#e2e8f0", color: "#64748b", backgroundColor: "#f8fafc" }}>
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}