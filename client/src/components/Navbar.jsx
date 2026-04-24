import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API, { API_BASE_URL } from "../utils/api";
import { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

function NavLinkItem({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`relative text-sm font-medium tracking-wide transition-colors duration-200 group
        ${active ? "text-orange-500" : "text-slate-600 hover:text-slate-900"}`}
    >
      {children}
      <span
        className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-orange-500 transition-all duration-300
          ${active ? "w-full" : "w-0 group-hover:w-full"}`}
      />
    </Link>
  );
}

export default function Navbar() {
  const { user, setUser } = useAuth();
  const isAdminUser = Boolean(user?.isAdmin);
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);

  const canUseNotifications = typeof window !== "undefined" && "Notification" in window;

  const maybeNotify = useCallback((title, body) => {
    if (!canUseNotifications || notificationPermission !== "granted") return;
    if (document.visibilityState === "visible" && location.pathname === "/chat") return;
    try {
      new Notification(title, { body, icon: "/vite.svg" });
    } catch {
      // Ignore browser notification failures.
    }
  }, [canUseNotifications, notificationPermission, location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (user && !isAdminUser) {
      API.get('/api/items?mine=true').then(res => {
        setIsSeller(res.data.length > 0);
      }).catch(() => queueMicrotask(() => setIsSeller(false)));
    } else {
      queueMicrotask(() => setIsSeller(false));
    }
  }, [user, isAdminUser]);

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      (async () => {
        if (!user || isAdminUser) {
          if (!cancelled) setUnreadCount(0);
          return;
        }

        try {
          const res = await API.get('/api/chat');
          const chats = Array.isArray(res.data) ? res.data : [];
          const unread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
          if (!cancelled) setUnreadCount(unread);
        } catch {
          if (!cancelled) setUnreadCount(0);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [user, isAdminUser]);

  useEffect(() => {
    if (!user || isAdminUser) return;

    const socket = io(API_BASE_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    const joinUserRoom = () => socket.emit('joinUserRoom', user._id);
    const handleChatEvent = () => {
      queueMicrotask(() => {
        (async () => {
          try {
            const res = await API.get('/api/chat');
            const chats = Array.isArray(res.data) ? res.data : [];
            setUnreadCount(chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0));
          } catch {
            setUnreadCount(0);
          }
        })();
      });
    };

    if (socket.connected) joinUserRoom();
    socket.on('connect', joinUserRoom);
    socket.on('messageReceived', (data) => {
      handleChatEvent();
      maybeNotify('New message received', data?.lastMessage?.message || 'You have a new chat message.');
    });
    socket.on('chatCreated', () => {
      handleChatEvent();
      maybeNotify('New chat started', 'Someone has started a conversation with you.');
    });

    return () => {
      socket.off('connect', joinUserRoom);
      socket.off('messageReceived');
      socket.off('chatCreated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, isAdminUser, location.pathname, notificationPermission, maybeNotify]);

  const requestNotifications = async () => {
    if (!canUseNotifications) return;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      maybeNotify('Notifications enabled', 'You will now see message alerts on this device.');
    }
  };

  useEffect(() => {
    queueMicrotask(() => setMenuOpen(false));
  }, [location.pathname]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await API.get("/api/auth/logout");
      setUser(null);
      toast.success("Logged out successfully!");
    } catch (error) {
      console.error("Logout failed:", error);
      setUser(null);
      toast.success("Logged out successfully!");
    }
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const isActive = (path) => location.pathname === path;

  const handleSearchSubmit = () => {
    const trimmedQuery = searchQuery.trim();
    const target = trimmedQuery ? `/products?search=${encodeURIComponent(trimmedQuery)}` : "/products";
    navigate(target);
    setMenuOpen(false);
  };

  // Voice search handler
  const handleVoiceSearch = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser.");
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      setSearchQuery(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300
          ${scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_2px_24px_rgba(0,0,0,0.09)] py-2.5"
            : "bg-white border-b border-slate-100 py-3"
          }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center gap-2 sm:gap-4">

          {/* ── LEFT: Logo ── */}
          <Link to="/" className="flex items-center gap-2 group select-none shrink-0 min-w-0">
            <span className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-br from-orange-500 to-rose-500 shadow-md shadow-orange-200 transition-transform duration-200 group-hover:scale-105">
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </span>
            <span className="text-[1.05rem] sm:text-[1.15rem] font-extrabold tracking-tight leading-none truncate">
              <span className="text-slate-800">Campus</span>
              <span className="text-orange-500">Kart</span>
            </span>
          </Link>

          {/* ── CENTER: Search Bar / Spacer ── */}
          <div className="hidden md:flex flex-1 justify-center px-6">
            {!isAdminUser && <div
              className={`flex items-center w-full max-w-2xl rounded-2xl border transition-all duration-300
                ${searchFocused
                  ? "border-orange-400 shadow-[0_0_0_3px_rgba(249,115,22,0.12)] bg-white"
                  : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
            >
              {/* Search Icon */}
              <span className="pl-4 pr-2 text-slate-400 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>

              {/* Input */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search products, categories, sellers..."
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder-slate-400 py-2.5 pr-1 outline-none"
              />

              {/* Clear button */}
              {searchQuery && (
                <button
                  onMouseDown={(e) => { e.preventDefault(); setSearchQuery(""); }}
                  className="p-1.5 mr-1 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Divider */}
              <span className="w-px h-5 bg-slate-200 mx-1 shrink-0" />

              {/* Voice Button */}
              <button
                onClick={handleVoiceSearch}
                title={isListening ? "Stop listening" : "Search by voice"}
                className={`flex items-center justify-center w-8 h-8 mx-1 rounded-xl transition-all duration-200 shrink-0
                  ${isListening
                    ? "bg-red-500 text-white shadow-sm shadow-red-300 scale-110 animate-pulse"
                    : "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                  }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="2" width="6" height="12" rx="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8" />
                </svg>
              </button>

              {/* Search Submit */}
              <button
                onClick={handleSearchSubmit}
                className="m-1.5 px-4 py-1.5 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 text-white text-xs font-bold hover:opacity-90 active:scale-95 transition-all shrink-0 shadow-sm shadow-orange-200"
              >
                Search
              </button>
            </div>}
          </div>

          {/* ── RIGHT: Nav Links + Auth ── */}
          <div className="hidden md:flex items-center gap-4 shrink-0">
            {!isAdminUser && <NavLinkItem to="/products" active={isActive('/products')}>Products</NavLinkItem>}

            {user && !isAdminUser && (
              <NavLinkItem to="/chat" active={isActive('/chat')}>
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                  {unreadCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavLinkItem>
            )}

            {user && !isAdminUser && canUseNotifications && notificationPermission !== 'granted' && (
              <button
                onClick={requestNotifications}
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold hover:bg-slate-100 transition-colors duration-200"
                title="Enable message notifications"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.75v5.408c0 .538-.214 1.055-.595 1.436L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Alerts
              </button>
            )}

            {!isAdminUser && <NavLinkItem to="/wishlist" active={isActive('/wishlist')}>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Wishlist
              </span>
            </NavLinkItem>}

            {user && !isAdminUser && (
              <Link
                to="/sell"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 text-sm font-semibold hover:bg-orange-100 transition-colors duration-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Sell
              </Link>
            )}

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200" />

            {user ? (
              <div className="flex items-center gap-2">
                {canUseNotifications && notificationPermission !== 'granted' && !isAdminUser && (
                  <button
                    onClick={requestNotifications}
                    className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all duration-200"
                    title="Enable message notifications"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C8.67 6.165 8 7.388 8 8.75v5.408c0 .538-.214 1.055-.595 1.436L6 17h5m4 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>
                )}

                {/* Avatar chip */}
                <Link to="/profile" className="flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors">
                  {user.avatar && !avatarError ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-7 h-7 rounded-full object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-linear-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                      {(user.username || "U")[0].toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-700 max-w-22.5 truncate">
                    {user.username}
                  </span>
                  {!isAdminUser && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isSeller ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {isSeller ? 'Seller' : 'Buyer'}
                    </span>
                  )}
                  {isAdminUser && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </Link>

                {isAdminUser && (
                  <Link
                    to="/admin"
                    className="flex items-center justify-center w-8 h-8 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors duration-200"
                    title="Admin Dashboard"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </Link>
                )}

                {/* Logout icon button */}
                <button
                  onClick={handleLogoutClick}
                  title="Logout"
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-1"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-linear-to-r from-orange-500 to-rose-500 text-white text-sm font-semibold shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* ── Mobile: Voice + Hamburger ── */}
          <div className="md:hidden ml-auto flex items-center gap-1.5">
            {!isAdminUser && unreadCount > 0 && (
              <Link
                to="/chat"
                className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-red-50 text-red-600"
                aria-label="Unread messages"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </Link>
            )}
            {!isAdminUser && <button
              onClick={handleVoiceSearch}
              className={`hidden xs:flex w-9 h-9 items-center justify-center rounded-lg transition-all
                ${isListening ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-500 hover:bg-slate-100"}`}
              aria-label={isListening ? "Stop listening" : "Search by voice"}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10a7 7 0 0 1-14 0M12 19v3M8 22h8" />
              </svg>
            </button>}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex flex-col justify-center items-center w-9 h-9 rounded-lg hover:bg-slate-100 transition-colors gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300 ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out
            ${menuOpen ? "max-h-125 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="px-4 pt-3 pb-5 border-t border-slate-100 flex flex-col gap-2 bg-white">

            {/* Mobile Search Bar */}
            {!isAdminUser && <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 mb-1 overflow-hidden">
              <span className="pl-3 pr-2 text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit();
                  }
                }}
                placeholder="Search products..."
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder-slate-400 py-2.5 outline-none"
              />
              <button
                onClick={handleSearchSubmit}
                className="mr-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-orange-500 to-rose-500 text-white text-xs font-bold hover:opacity-90 transition-all shrink-0"
              >
                Go
              </button>
            </div>}

            {/* Mobile Nav Links */}
            {[
              ...(!isAdminUser ? [{ to: "/products", label: "Products" }] : []),
              ...(user ? [{ to: "/profile", label: "Profile" }] : []),
              ...(user && !isAdminUser ? [{ to: "/chat", label: "Messages", showUnread: true }] : []),
              ...(!isAdminUser ? [{ to: "/wishlist", label: "Wishlist" }] : []),
              ...(user && !isAdminUser ? [{ to: "/sell", label: "+ Sell" }] : []),
              ...(user && user.isAdmin ? [{ to: "/admin", label: "⚙️ Admin Dashboard" }] : []),
            ].map(({ to, label, showUnread }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors border
                  ${isActive(to) ? "bg-orange-50 text-orange-500" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                style={{ borderColor: isActive(to) ? '#fed7aa' : '#e2e8f0' }}
              >
                <span className="inline-flex items-center gap-2 min-w-0">
                  {label}
                  {showUnread && unreadCount > 0 && (
                    <span className="inline-flex min-w-5 h-5 px-1 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </Link>
            ))}

            <div className="mt-1 pt-3 border-t border-slate-100 flex flex-col gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-linear-to-br from-orange-400 to-rose-400 flex items-center justify-center text-white text-xs font-bold">
                      {(user.username || "U")[0].toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-700 font-medium truncate min-w-0">{user.username}</span>
                  </div>
                  <button
                    onClick={handleLogoutClick}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left border border-red-100"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">
                    Login
                  </Link>
                  <Link to="/signup" className="py-3 rounded-xl text-sm font-semibold text-center bg-linear-to-r from-orange-500 to-rose-500 text-white shadow-sm">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out of your account?</p>
              <div className="flex gap-3">
                <button
                  onClick={cancelLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="h-15" />
    </>
  );
}