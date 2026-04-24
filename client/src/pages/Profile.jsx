import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const TABS = ["Listings", "Orders", "Messages", "Saved Searches", "Reviews", "Wishlist", "Settings"];

const ORDER_STATUS_STYLES = {
  placed: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8", label: "Placed" },
  confirmed: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a", label: "Confirmed" },
  shipped: { bg: "#ecfeff", border: "#a5f3fc", text: "#0891b2", label: "Shipped" },
  out_for_delivery: { bg: "#fefce8", border: "#fde68a", text: "#ca8a04", label: "Out for delivery" },
  delivered: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d", label: "Delivered" },
  cancelled: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626", label: "Cancelled" },
};

export default function Profile() {
  const { user, setUser }         = useAuth();
  const navigate                  = useNavigate();
  const [searchParams]            = useSearchParams();
  const avatarRef                 = useRef(null);

  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "Orders" ? "Orders" : "Listings");
  const [listings, setListings]   = useState([]);
  const [orders, setOrders]       = useState([]);
  const [chats, setChats]         = useState([]);
  const [savedSearches, setSavedSearches] = useState([]);
  const [reviews, setReviews]     = useState({ receivedReviews: [], givenReviews: [], ratingSummary: { average: 0, total: 0 } });
  const [wishlist, setWishlist]   = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast]         = useState(null);
  const [orderStatusDrafts, setOrderStatusDrafts] = useState({});
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [savingReviewId, setSavingReviewId] = useState(null);

  // Settings form
  const [settings, setSettings]   = useState({ name: user?.name || "", email: user?.email || "", bio: user?.bio || "" });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [saving, setSaving]               = useState(false);
  const [pwForm, setPwForm]               = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw]               = useState({ current: false, next: false, confirm: false });
  const [pwSaving, setPwSaving]           = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    Promise.all([
      API.get("/api/items?mine=true"),
      API.get("/api/orders/my"),
      API.get("/api/wishlist"),
      API.get("/api/chat"),
      API.get("/api/saved-searches"),
      API.get("/api/reviews/me"),
    ]).then(([l, o, w, c, s, r]) => {
      setListings(l.data);
      setOrders(o.data.orders || []);
      setWishlist(w.data);
      setChats(c.data);
      setSavedSearches(s.data || []);
      setReviews(r.data || { receivedReviews: [], givenReviews: [], ratingSummary: { average: 0, total: 0 } });
    }).finally(() => setLoadingData(false));
  }, [user, navigate]);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && TABS.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append("name", settings.name);
      data.append("bio", settings.bio);
      if (avatarFile) data.append("avatar", avatarFile);
      const res = await API.put("/api/auth/profile", data);
      setUser(res.data);
      showToast("Profile updated successfully!");
    } catch {
      showToast("Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) return showToast("New passwords don't match.", "error");
    if (pwForm.next.length < 6) return showToast("Password must be at least 6 characters.", "error");
    setPwSaving(true);
    try {
      await API.put("/api/auth/password", { current: pwForm.current, password: pwForm.next });
      setPwForm({ current: "", next: "", confirm: "" });
      showToast("Password changed successfully!");
    } catch {
      showToast("Current password is incorrect.", "error");
    } finally {
      setPwSaving(false);
    }
  };

  const deleteListingLocally = (id) => setListings((l) => l.filter((i) => i._id !== id));
  const removeWishlistLocally = (id) => setWishlist((w) => w.filter((i) => i._id !== id));

  const handleOrderStatusChange = (orderId, value) => {
    setOrderStatusDrafts((prev) => ({ ...prev, [orderId]: value }));
  };

  const updateOrderStatus = async (orderId, forcedStatus = null) => {
    const status = forcedStatus || orderStatusDrafts[orderId];
    if (!status) return;

    setSavingOrderId(orderId);
    try {
      const res = await API.patch(`/api/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((order) => (order._id === orderId ? res.data.order : order)));
      showToast("Order status updated.");
    } catch {
      showToast("Failed to update order status.", "error");
    } finally {
      setSavingOrderId(null);
    }
  };

  const submitReview = async (orderId) => {
    const draft = reviewDrafts[orderId] || { rating: 5, comment: '' };
    if (!draft.rating) return showToast('Choose a rating first.', 'error');

    setSavingReviewId(orderId);
    try {
      const res = await API.post('/api/reviews', {
        orderId,
        rating: draft.rating,
        comment: draft.comment || '',
      });
      setReviews((prev) => {
        const existing = prev.givenReviews.filter((review) => review.order?._id !== orderId);
        return {
          ...prev,
          givenReviews: [res.data.review, ...existing],
        };
      });
      setReviewDrafts((prev) => ({ ...prev, [orderId]: { rating: 5, comment: '' } }));
      showToast('Review submitted.');
    } catch {
      showToast('Unable to submit review.', 'error');
    } finally {
      setSavingReviewId(null);
    }
  };

  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  const joinDate  = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Recently";

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border outline-none transition-all duration-200";
  const inputStyle = { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" };
  const focusH = {
    onFocus: e => { e.target.style.borderColor = "#1d4ed8"; e.target.style.boxShadow = "0 0 0 3px rgba(29,78,216,0.1)"; },
    onBlur:  e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; },
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold"
          style={toast.type === "error"
            ? { backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }
            : { backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" }}>
          {toast.type === "error"
            ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
          {toast.msg}
        </div>
      )}

      {/* ── Profile Hero Banner ── */}
      <div className="relative" style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="absolute -bottom-0.5 left-0 right-0">
          <svg viewBox="0 0 1440 40" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C480,0 960,0 1440,40 L1440,40 L0,40 Z" fill="#faf8f4" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-white shadow-xl"
                style={{ backgroundColor: "#1e40af" }}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl font-extrabold" style={{ color: "#faf8f4" }}>{initials}</div>
                }
              </div>
            </div>

            {/* Name + meta */}
            <div className="text-center sm:text-left pb-1">
              <h1 className="text-2xl font-extrabold" style={{ color: "#faf8f4" }}>
                {user.name || "Campus Student"}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(250,248,244,0.7)" }}>{user.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#faf8f4" }}>
                  Joined {joinDate}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#faf8f4" }}>
                  {listings.length} Listing{listings.length !== 1 ? "s" : ""}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#faf8f4" }}>
                  {wishlist.length} Wishlisted
                </span>
                {reviews.ratingSummary.total > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#faf8f4" }}>
                    ★ {reviews.ratingSummary.average} from {reviews.ratingSummary.total}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="sticky top-0 z-30" style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-1">
          {TABS.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="relative px-5 py-4 text-sm font-semibold transition-colors duration-200"
              style={{ color: activeTab === tab ? "#1d4ed8" : "#64748b" }}>
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: "#1d4ed8" }} />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ══ TAB: Listings ══ */}
        {activeTab === "Listings" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg" style={{ color: "#1e293b" }}>My Listings</h2>
              <Link to="/sell"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                New Listing
              </Link>
            </div>

            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse overflow-hidden" style={{ backgroundColor: "#e8e4dc" }}>
                    <div className="h-36" style={{ backgroundColor: "#d4cfc6" }} />
                    <div className="p-3 space-y-2">
                      <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#d4cfc6" }} />
                      <div className="h-3 rounded w-1/3" style={{ backgroundColor: "#d4cfc6" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#eff6ff" }}>
                  <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "#1e293b" }}>No listings yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>Start selling your unused items!</p>
                <Link to="/sell" className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  Post a Listing
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.map((item) => (
                  <ProfileItemCard key={item._id} item={item} onDelete={deleteListingLocally} showToast={showToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Messages ══ */}
        {activeTab === "Messages" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg" style={{ color: "#1e293b" }}>Messages</h2>
              <Link to="/chat"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Open Chat
              </Link>
            </div>

            {loadingData ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: "#e8e4dc" }} />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 rounded w-1/3" style={{ backgroundColor: "#e8e4dc" }} />
                        <div className="h-2 rounded w-1/4" style={{ backgroundColor: "#e8e4dc" }} />
                      </div>
                    </div>
                    <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#e8e4dc" }} />
                  </div>
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#eff6ff" }}>
                  <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "#1e293b" }}>No messages yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>When buyers message you about your listings, they'll appear here.</p>
                <Link to="/products" className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {chats.map((chat) => {
                  const isBuyer = user._id === chat.buyer?._id;
                  const otherParty = isBuyer ? chat.seller : chat.buyer;
                  const lastMsg = chat.lastMessage?.message;
                  const timeAgo = chat.lastMessage?.createdAt
                    ? (() => {
                        const diff = (Date.now() - new Date(chat.lastMessage.createdAt)) / 1000;
                        if (diff < 60) return 'just now';
                        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                        return new Date(chat.lastMessage.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      })()
                    : 'No messages';

                  return (
                    <Link key={chat._id} to={`/chat`}
                      className="block rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
                      style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                          {(otherParty?.username || otherParty?.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: "#1e293b" }}>
                            {otherParty?.username || otherParty?.name || 'Unknown'}
                          </p>
                          <p className="text-xs truncate" style={{ color: "#64748b" }}>
                            {chat.item?.title}
                          </p>
                        </div>
                        <span className="text-xs shrink-0" style={{ color: "#94a3b8" }}>
                          {timeAgo}
                        </span>
                      </div>
                      {lastMsg && (
                        <p className="text-sm truncate" style={{ color: "#475569" }}>
                          {lastMsg}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Orders ══ */}
        {activeTab === "Orders" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg" style={{ color: "#1e293b" }}>Orders & Tracking</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingData ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl p-4 animate-pulse" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                    <div className="h-4 rounded w-1/3 mb-3" style={{ backgroundColor: "#e8e4dc" }} />
                    <div className="h-3 rounded w-2/3 mb-2" style={{ backgroundColor: "#e8e4dc" }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: "#e8e4dc" }} />
                  </div>
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#eff6ff" }}>
                  <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.1 5H19M7 13v8a2 2 0 002 2h10a2 2 0 002-2v-3" />
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "#1e293b" }}>No orders yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>Orders you place will appear here with delivery tracking.</p>
                <Link to="/products" className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const st = ORDER_STATUS_STYLES[order.status] || ORDER_STATUS_STYLES.placed;
                  const timeline = order.trackingNotes || [];
                  const isBuyer = order.buyer?._id === user._id;
                  const isSeller = order.seller?._id === user._id;
                  const editableStatuses = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
                  const currentDraft = orderStatusDrafts[order._id] || order.status;
                  const showSellerControls = isSeller && order.status !== 'delivered' && order.status !== 'cancelled';
                  const canBuyerCancel = isBuyer && ['placed', 'confirmed'].includes(order.status);
                  const hasReviewed = reviews.givenReviews.some((review) => String(review.order?._id || review.order) === String(order._id));
                  const reviewDraft = reviewDrafts[order._id] || { rating: 5, comment: '' };

                  return (
                    <div key={order._id} className="rounded-2xl border p-4 sm:p-5" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: st.bg, border: `1px solid ${st.border}`, color: st.text }}>
                              {st.label}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f8fafc", color: "#64748b" }}>
                              #{order.orderNumber}
                            </span>
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: isBuyer ? "#eff6ff" : "#f0fdf4", color: isBuyer ? "#1d4ed8" : "#16a34a" }}>
                              {isBuyer ? "Buying" : "Selling"}
                            </span>
                            {isSeller && (
                              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                                Seller controls
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-sm" style={{ color: "#1e293b" }}>{order.item?.title}</p>
                          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                            Seller: {order.seller?.username || order.seller?.email || "Unknown"}
                          </p>
                          <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                            Amount: ₹{order.amount}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Placed on</p>
                          <p className="text-sm font-bold" style={{ color: "#1e293b" }}>
                            {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl p-3" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Tracking</p>
                          <div className="space-y-2">
                            {timeline.slice(-4).map((entry, idx) => {
                              const entryStyle = ORDER_STATUS_STYLES[entry.status] || ORDER_STATUS_STYLES.placed;
                              return (
                                <div key={`${entry.status}-${idx}`} className="flex items-start gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full mt-1" style={{ backgroundColor: entryStyle.text }} />
                                  <div>
                                    <p className="text-xs font-bold" style={{ color: "#1e293b" }}>{entryStyle.label}</p>
                                    <p className="text-[11px]" style={{ color: "#64748b" }}>{entry.note}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-xl p-3" style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0" }}>
                          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>Delivery Progress</p>
                          <div className="space-y-2">
                            {['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'].map((step) => {
                              const stepStyle = ORDER_STATUS_STYLES[step];
                              const activeOrder = ['placed', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
                              const currentIndex = activeOrder.indexOf(order.status);
                              const stepIndex = activeOrder.indexOf(step);
                              const done = currentIndex >= stepIndex;
                              return (
                                <div key={step} className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: done ? stepStyle.text : '#ffffff', borderColor: done ? stepStyle.text : '#cbd5e1' }} />
                                  <span className="text-xs font-semibold" style={{ color: done ? '#1e293b' : '#94a3b8' }}>
                                    {stepStyle.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {showSellerControls && (
                        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: "#faf5ff", border: "1px solid #e9d5ff" }}>
                          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                            <div className="flex-1">
                              <label className="block text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "#94a3b8" }}>
                                Update seller status
                              </label>
                              <select
                                value={currentDraft}
                                onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                                style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                              >
                                {editableStatuses.map((status) => (
                                  <option key={status} value={status}>
                                    {ORDER_STATUS_STYLES[status]?.label || status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              onClick={() => updateOrderStatus(order._id)}
                              disabled={savingOrderId === order._id}
                              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                              style={{ background: 'linear-gradient(135deg,#7c3aed,#8b5cf6)', color: '#faf8f4' }}
                            >
                              {savingOrderId === order._id ? 'Saving…' : 'Save Status'}
                            </button>
                          </div>
                          <p className="text-[11px] mt-2" style={{ color: '#6b21a8' }}>
                            Mark shipped when you hand it to the courier, out for delivery when it leaves your side, and delivered once the buyer receives it.
                          </p>
                        </div>
                      )}

                      {canBuyerCancel && (
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => updateOrderStatus(order._id, 'cancelled')}
                            disabled={savingOrderId === order._id}
                            className="px-4 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-60"
                            style={{ borderColor: '#fecaca', color: '#dc2626', backgroundColor: '#fef2f2' }}
                          >
                            {savingOrderId === order._id ? 'Cancelling…' : 'Cancel Order'}
                          </button>
                        </div>
                      )}

                      {order.status === 'delivered' && !hasReviewed && (isBuyer || isSeller) && (
                        <div className="mt-4 rounded-xl p-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <p className="text-sm font-bold mb-3" style={{ color: '#1e293b' }}>Leave a review</p>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => setReviewDrafts((prev) => ({ ...prev, [order._id]: { ...reviewDraft, rating } }))}
                                className="w-9 h-9 rounded-full border text-sm font-bold"
                                style={{
                                  borderColor: reviewDraft.rating === rating ? '#1d4ed8' : '#e2e8f0',
                                  backgroundColor: reviewDraft.rating === rating ? '#eff6ff' : '#ffffff',
                                  color: reviewDraft.rating === rating ? '#1d4ed8' : '#64748b',
                                }}
                              >
                                {rating}
                              </button>
                            ))}
                          </div>
                          <textarea
                            rows={3}
                            value={reviewDraft.comment}
                            onChange={(e) => setReviewDrafts((prev) => ({ ...prev, [order._id]: { ...reviewDraft, comment: e.target.value } }))}
                            placeholder="Share what went well or what could improve"
                            className="w-full rounded-xl border px-3 py-2 text-sm mb-3 outline-none"
                            style={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b' }}
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={() => submitReview(order._id)}
                              disabled={savingReviewId === order._id}
                              className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                              style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', color: '#faf8f4' }}
                            >
                              {savingReviewId === order._id ? 'Submitting…' : 'Submit Review'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Saved Searches ══ */}
        {activeTab === "Saved Searches" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg" style={{ color: "#1e293b" }}>Saved Searches</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                {savedSearches.length} alert{savedSearches.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loadingData ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: "#e8e4dc" }} />
                ))}
              </div>
            ) : savedSearches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-bold" style={{ color: "#1e293b" }}>No saved searches yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>Use the Save Search button on the Products page to keep track of new matches.</p>
                <Link to="/products" className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <div key={search._id} className="rounded-2xl border p-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <p className="font-bold" style={{ color: "#1e293b" }}>{search.name || search.query || "Saved search"}</p>
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                          {search.category !== "All" ? `${search.category} · ` : ""}
                          {search.mine ? "My listings · " : ""}
                          {search.priceMin ? `Min ₹${search.priceMin} · ` : ""}
                          {search.priceMax ? `Max ₹${search.priceMax} · ` : ""}
                          {search.sort}
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full self-start" style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}>
                        {search.matchingCount} new match{search.matchingCount !== 1 ? "es" : ""}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        to={`/products?search=${encodeURIComponent(search.query || "")}`}
                        className="px-3 py-2 rounded-xl text-xs font-bold border"
                        style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
                      >
                        View Matches
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await API.delete(`/api/saved-searches/${search._id}`);
                            setSavedSearches((prev) => prev.filter((entry) => entry._id !== search._id));
                            showToast("Saved search removed.");
                          } catch {
                            showToast("Failed to remove saved search.", "error");
                          }
                        }}
                        className="px-3 py-2 rounded-xl text-xs font-bold border"
                        style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#dc2626" }}
                      >
                        Delete
                      </button>
                    </div>

                    {Array.isArray(search.matchingItems) && search.matchingItems.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {search.matchingItems.map((item) => (
                          <Link key={item._id} to={`/item/${item._id}`} className="rounded-xl border p-3" style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
                            <p className="text-sm font-bold line-clamp-2" style={{ color: "#1e293b" }}>{item.title}</p>
                            <p className="text-xs mt-1" style={{ color: "#64748b" }}>₹{item.price}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Reviews ══ */}
        {activeTab === "Reviews" && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-extrabold text-lg" style={{ color: "#1e293b" }}>Reviews</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}>
                ★ {reviews.ratingSummary.average || 0} / {reviews.ratingSummary.total || 0}
              </span>
            </div>

            {reviews.receivedReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="font-bold" style={{ color: "#1e293b" }}>No reviews yet</p>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>Once an order is delivered, buyers and sellers can rate each other here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.receivedReviews.map((review) => (
                  <div key={review._id} className="rounded-2xl border p-4" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold" style={{ color: "#1e293b" }}>{review.reviewer?.username || "Buyer"}</p>
                        <p className="text-xs mt-1" style={{ color: "#64748b" }}>{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                        {'★'.repeat(review.rating)}
                      </span>
                    </div>
                    {review.comment && <p className="text-sm mt-3" style={{ color: "#475569" }}>{review.comment}</p>}
                    <p className="text-xs mt-3" style={{ color: "#94a3b8" }}>{review.order?.item?.title || "Order review"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Wishlist ══ */}
        {activeTab === "Wishlist" && (
          <div>
            <h2 className="font-extrabold text-lg mb-5" style={{ color: "#1e293b" }}>Saved Items</h2>

            {loadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse overflow-hidden" style={{ backgroundColor: "#e8e4dc" }}>
                    <div className="h-36" style={{ backgroundColor: "#d4cfc6" }} />
                    <div className="p-3 space-y-2">
                      <div className="h-3 rounded w-2/3" style={{ backgroundColor: "#d4cfc6" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : wishlist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#eff6ff" }}>
                  <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <p className="font-bold" style={{ color: "#1e293b" }}>Nothing saved yet</p>
                <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>Heart items to save them here.</p>
                <Link to="/products" className="px-6 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  Browse Listings
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map((item) => (
                  <WishCard key={item._id} item={item} onRemove={removeWishlistLocally} showToast={showToast} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: Settings ══ */}
        {activeTab === "Settings" && (
          <div className="flex flex-col gap-6 max-w-lg">

            {/* Edit Profile */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
              <h3 className="font-extrabold mb-5" style={{ color: "#1e293b" }}>Edit Profile</h3>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                {/* Avatar upload */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0"
                    style={{ backgroundColor: "#1e40af" }}>
                    {avatarPreview
                      ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl font-extrabold" style={{ color: "#faf8f4" }}>{initials}</div>}
                  </div>
                  <div>
                    <button type="button" onClick={() => avatarRef.current?.click()}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80"
                      style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}>
                      Change Photo
                    </button>
                    <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>JPG, PNG up to 5MB</p>
                  </div>
                  <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Full Name</label>
                  <input type="text" value={settings.name}
                    onChange={(e) => setSettings(s => ({ ...s, name: e.target.value }))}
                    className={inputClass} style={inputStyle} {...focusH} />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Email</label>
                  <input type="email" value={settings.email} readOnly
                    className={`${inputClass} cursor-not-allowed`}
                    style={{ ...inputStyle, backgroundColor: "#f8fafc", color: "#94a3b8" }} />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>Bio</label>
                  <textarea value={settings.bio} rows={3}
                    onChange={(e) => setSettings(s => ({ ...s, bio: e.target.value }))}
                    placeholder="Tell buyers a little about yourself..."
                    className={`${inputClass} resize-none`} style={inputStyle} {...focusH} />
                </div>

                <button type="submit" disabled={saving}
                  className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>
                  {saving
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Saving…</>
                    : "Save Changes"}
                </button>
              </form>
            </div>

            {/* Change Password */}
            <div className="rounded-2xl border p-6" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
              <h3 className="font-extrabold mb-5" style={{ color: "#1e293b" }}>Change Password</h3>
              <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                {[
                  { key: "current", label: "Current Password" },
                  { key: "next",    label: "New Password" },
                  { key: "confirm", label: "Confirm New Password" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold mb-1.5" style={{ color: "#374151" }}>{label}</label>
                    <div className="relative">
                      <input
                        type={showPw[key] ? "text" : "password"}
                        value={pwForm[key]}
                        onChange={(e) => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                        className={`${inputClass} pr-11`} style={inputStyle} {...focusH} />
                      <button type="button"
                        onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: "#94a3b8" }}>
                        {showPw[key]
                          ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                      </button>
                    </div>
                  </div>
                ))}
                <button type="submit" disabled={pwSaving}
                  className="py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ backgroundColor: "#1e293b", color: "#faf8f4" }}>
                  {pwSaving
                    ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Updating…</>
                    : "Update Password"}
                </button>
              </form>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: "#fff5f5", borderColor: "#fecaca" }}>
              <h3 className="font-extrabold mb-1 text-sm" style={{ color: "#dc2626" }}>Danger Zone</h3>
              <p className="text-xs mb-3" style={{ color: "#94a3b8" }}>Permanently delete your account and all data.</p>
              <button className="px-5 py-2 rounded-xl text-xs font-bold border transition-all hover:opacity-80"
                style={{ borderColor: "#fca5a5", color: "#ef4444", backgroundColor: "#fef2f2" }}>
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Mini listing card ── */
function ProfileItemCard({ item, onDelete, showToast }) {
  const [imgErr, setImgErr]     = useState(false);
  const [confirm, setConfirm]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const deleteItem = async () => {
    setDeleting(true);
    try {
      await API.delete(`/api/items/${item._id}`);
      onDelete(item._id);
      showToast("Listing deleted.");
    } catch {
      showToast("Failed to delete.", "error");
      setDeleting(false); setConfirm(false);
    }
  };

  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-all hover:-translate-y-0.5 group"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
      <Link to={`/item/${item._id}`} className="block overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
        {item.image && !imgErr
          ? <img src={item.image} alt={item.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} />
          : <div className="w-full h-36 flex items-center justify-center"><svg className="w-8 h-8" style={{ color: "#cbd5e1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={`/item/${item._id}`}><p className="text-sm font-bold line-clamp-1" style={{ color: "#1e293b" }}>{item.title}</p></Link>
        <p className="text-sm font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price}</p>
        <div className="flex gap-2 mt-auto">
          {!confirm ? (
            <>
              <Link to={`/edit/${item._id}`} className="flex-1 py-2 rounded-xl text-xs font-bold text-center border transition-all"
                style={{ borderColor: "#bfdbfe", color: "#1d4ed8", backgroundColor: "#eff6ff" }}>Edit</Link>
              <button onClick={() => setConfirm(true)} className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                style={{ borderColor: "#fecaca", color: "#ef4444", backgroundColor: "#fef2f2" }}>Delete</button>
            </>
          ) : (
            <>
              <button onClick={deleteItem} disabled={deleting} className="flex-1 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: "#ef4444", color: "#fff" }}>{deleting ? "…" : "Confirm"}</button>
              <button onClick={() => setConfirm(false)} className="flex-1 py-2 rounded-xl text-xs font-semibold border"
                style={{ borderColor: "#e2e8f0", color: "#64748b" }}>Cancel</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Mini wishlist card ── */
function WishCard({ item, onRemove, showToast }) {
  const [imgErr, setImgErr]   = useState(false);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    setRemoving(true);
    try {
      await API.delete(`/api/wishlist/${item._id}`);
      onRemove(item._id);
      showToast("Removed from wishlist.");
    } catch {
      showToast("Failed to remove.", "error");
      setRemoving(false);
    }
  };

  return (
    <div className="rounded-2xl border overflow-hidden flex flex-col hover:shadow-md transition-all hover:-translate-y-0.5 group"
      style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
      <Link to={`/item/${item._id}`} className="block overflow-hidden" style={{ backgroundColor: "#f1f5f9" }}>
        {item.image && !imgErr
          ? <img src={item.image} alt={item.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" onError={() => setImgErr(true)} />
          : <div className="w-full h-36 flex items-center justify-center"><svg className="w-8 h-8" style={{ color: "#cbd5e1" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>}
      </Link>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <Link to={`/item/${item._id}`}><p className="text-sm font-bold line-clamp-1" style={{ color: "#1e293b" }}>{item.title}</p></Link>
        <p className="text-sm font-extrabold" style={{ color: "#1d4ed8" }}>₹{item.price}</p>
        <div className="flex gap-2 mt-auto">
          <Link to={`/item/${item._id}`} className="flex-1 py-2 rounded-xl text-xs font-bold text-center transition-all"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#faf8f4" }}>View</Link>
          <button onClick={remove} disabled={removing}
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
            style={{ borderColor: "#fecaca", backgroundColor: "#fef2f2" }}>
            {removing
              ? <svg className="w-3.5 h-3.5 animate-spin" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              : <svg className="w-3.5 h-3.5" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}