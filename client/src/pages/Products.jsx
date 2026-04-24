import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import API from "../utils/api";
import ItemCard from "../components/ItemCard";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Books", "Electronics", "Furniture", "Clothing", "Stationery", "Sports", "Lab Equipment", "Cycles"];
const SORT_OPTIONS = [
  { label: "Newest First",    value: "newest" },
  { label: "Oldest First",    value: "oldest" },
  { label: "Price: Low–High", value: "price_asc" },
  { label: "Price: High–Low", value: "price_desc" },
];
const PAGE_SIZE = 12;

export default function Products() {
  const [searchParams] = useSearchParams();
  const [items, setItems]           = useState([]);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [search, setSearch]         = useState("");
  const [mine, setMine]             = useState(false);
  const [campusOnly, setCampusOnly]  = useState(false);
  const [category, setCategory]     = useState("All");
  const [sort, setSort]             = useState("newest");
  const [priceMin, setPriceMin]     = useState("");
  const [priceMax, setPriceMax]     = useState("");
  const [viewMode, setViewMode]     = useState("grid"); // "grid" | "list"
  const [loading, setLoading]       = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage]             = useState(1);
  const [saveStatus, setSaveStatus] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || "";
    setSearch(searchFromUrl);
  }, [searchParams]);

  const getEmailDomain = (email) => {
    const normalized = String(email || "").trim().toLowerCase();
    const atIndex = normalized.lastIndexOf("@");
    return atIndex >= 0 ? normalized.slice(atIndex + 1) : "";
  };

  const userEmailDomain = getEmailDomain(user?.email);

  useEffect(() => {
    const loadData = async () => {
      try {
        const itemsRes = await API.get("/api/items");
        setItems(itemsRes.data);

        if (user) {
          const wishlistRes = await API.get("/api/wishlist");
          const ids = new Set(
            wishlistRes.data
              .map((entry) => entry?.item?._id)
              .filter(Boolean)
          );
          setWishlistedIds(ids);
        } else {
          setWishlistedIds(new Set());
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [search, mine, campusOnly, category, sort, priceMin, priceMax]);

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        const matchSearch   = i.title.toLowerCase().includes(search.toLowerCase());
        const createdById   = typeof i.createdBy === "object" ? i.createdBy?._id : i.createdBy;
        const sellerEmail   = typeof i.createdBy === "object" ? i.createdBy?.email : "";
        const matchMine     = !mine || createdById === user?._id;
        const matchCampus   = !campusOnly || !userEmailDomain || getEmailDomain(sellerEmail) === userEmailDomain;
        const matchCategory = category === "All" || i.category === category;
        const matchMin      = priceMin === "" || (i.price ?? 0) >= Number(priceMin);
        const matchMax      = priceMax === "" || (i.price ?? 0) <= Number(priceMax);
        return matchSearch && matchMine && matchCampus && matchCategory && matchMin && matchMax;
      })
      .sort((a, b) => {
        if (sort === "newest")     return new Date(b.createdAt) - new Date(a.createdAt);
        if (sort === "oldest")     return new Date(a.createdAt) - new Date(b.createdAt);
        if (sort === "price_asc")  return (a.price ?? 0) - (b.price ?? 0);
        if (sort === "price_desc") return (b.price ?? 0) - (a.price ?? 0);
        return 0;
      });
  }, [items, search, mine, campusOnly, category, sort, priceMin, priceMax, user, userEmailDomain]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const paginatedOwn = paginated.filter((i) => {
    const createdById = typeof i.createdBy === "object" ? i.createdBy?._id : i.createdBy;
    return createdById === user?._id;
  });
  const paginatedOthers = paginated.filter((i) => {
    const createdById = typeof i.createdBy === "object" ? i.createdBy?._id : i.createdBy;
    return createdById !== user?._id;
  });

  const clearFilters = () => {
    setSearch(""); setMine(false); setCampusOnly(false); setCategory("All");
    setSort("newest"); setPriceMin(""); setPriceMax("");
  };

  const saveSearch = async () => {
    if (!user) {
      setSaveStatus('Sign in to save searches.');
      return;
    }

    const name = window.prompt('Name this saved search', search || `${category} search`);
    if (name === null) return;

    try {
      await API.post('/api/saved-searches', {
        name,
        query: search,
        category,
        mine,
        campusOnly,
        priceMin,
        priceMax,
        sort,
      });
      setSaveStatus('Search saved. You can review alerts in your profile.');
    } catch {
      setSaveStatus('Unable to save search right now.');
    }
  };

  const handleWishlistChange = (itemId, isWishlisted) => {
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (isWishlisted) {
        next.add(itemId);
      } else {
        next.delete(itemId);
      }
      return next;
    });
  };

  // Active filter chips
  const activeChips = [
    ...(search       ? [{ key: "search",   label: `"${search}"`,          onRemove: () => setSearch("") }]       : []),
    ...(mine         ? [{ key: "mine",     label: "My Listings",           onRemove: () => setMine(false) }]      : []),
    ...(campusOnly   ? [{ key: "campus",   label: "Same College Only",    onRemove: () => setCampusOnly(false) }] : []),
    ...(category !== "All" ? [{ key: "cat", label: category,              onRemove: () => setCategory("All") }]  : []),
    ...(priceMin     ? [{ key: "pmin",     label: `Min ₹${priceMin}`,     onRemove: () => setPriceMin("") }]     : []),
    ...(priceMax     ? [{ key: "pmax",     label: `Max ₹${priceMax}`,     onRemove: () => setPriceMax("") }]     : []),
    ...(sort !== "newest" ? [{ key: "sort", label: SORT_OPTIONS.find(o => o.value === sort)?.label, onRemove: () => setSort("newest") }] : []),
  ];
  const hasActiveFilters = activeChips.length > 0;

  /* ── Shared sidebar content ── */
  const SidebarContent = ({ onClose }) => (
    <div className="flex flex-col gap-6">
      {/* My Listings */}
      {user && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>View</p>
          <button
            onClick={() => { setMine(v => !v); onClose?.(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200"
            style={mine
              ? { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }
              : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }}
          >
            My Listings
            <span className="w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
              style={mine ? { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" } : { borderColor: "#cbd5e1" }}>
              {mine && <svg className="w-2.5 h-2.5" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </span>
          </button>
        </div>
      )}

      {user && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Campus</p>
          <button
            onClick={() => setCampusOnly(v => !v)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200"
            style={campusOnly
              ? { backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }
              : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }}
          >
            Same College Only
            <span className="w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center"
              style={campusOnly ? { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" } : { borderColor: "#cbd5e1" }}>
              {campusOnly && <svg className="w-2.5 h-2.5" style={{ color: "#fff" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </span>
          </button>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
            Shows listings from sellers using the same college email domain as you.
          </p>
        </div>
      )}

      {/* Category */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Category</p>
        <div className="flex flex-col gap-0.5">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => { setCategory(cat); onClose?.(); }}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={category === cat
                ? { backgroundColor: "#1d4ed8", color: "#faf8f4" }
                : { backgroundColor: "transparent", color: "#475569" }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Price Range (₹)</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "#94a3b8" }}>₹</span>
            <input type="number" min="0" placeholder="Min"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              className="w-full pl-6 pr-2 py-2 rounded-lg text-xs border outline-none"
              style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#1e293b" }}
              onFocus={e => e.target.style.borderColor = "#1d4ed8"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
          <span className="self-center text-xs" style={{ color: "#94a3b8" }}>—</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: "#94a3b8" }}>₹</span>
            <input type="number" min="0" placeholder="Max"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              className="w-full pl-6 pr-2 py-2 rounded-lg text-xs border outline-none"
              style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#1e293b" }}
              onFocus={e => e.target.style.borderColor = "#1d4ed8"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
          </div>
        </div>
      </div>

      {/* Sort */}
      <div>
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#94a3b8" }}>Sort By</p>
        <div className="flex flex-col gap-0.5">
          {SORT_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => { setSort(opt.value); onClose?.(); }}
              className="text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150"
              style={sort === opt.value
                ? { backgroundColor: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }
                : { backgroundColor: "transparent", color: "#475569" }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button onClick={() => { clearFilters(); onClose?.(); }}
          className="py-2 rounded-xl text-xs font-bold border transition-all"
          style={{ borderColor: "#fca5a5", color: "#ef4444", backgroundColor: "#fef2f2" }}>
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#faf8f4" }}>

      {/* ── Page Header ── */}
      <div style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold" style={{ color: "#1e293b" }}>Browse Listings</h1>
              <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
                {loading ? "Loading..." : `${filtered.length} item${filtered.length !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* Search */}
            <div className="flex items-center rounded-2xl border w-full sm:w-80 transition-all duration-200"
              style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}>
              <span className="pl-3.5 pr-2 shrink-0" style={{ color: "#94a3b8" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </span>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm py-2.5 pr-3 outline-none" style={{ color: "#1e293b" }} />
              {search && (
                <button onClick={() => setSearch("")} className="pr-3 shrink-0" style={{ color: "#94a3b8" }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">

        {/* ── Desktop Sidebar ── */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="rounded-2xl border p-4 sticky top-20" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0" }}>
            <SidebarContent />
          </div>
        </aside>

        {/* ── Main ── */}
        <div className="flex-1 min-w-0">

          {/* Top bar: mobile filter btn + view toggle + sort */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* Mobile filter trigger */}
            <button onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold shrink-0"
              style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1d4ed8" }} />}
            </button>

            {user && (
              <button
                onClick={saveSearch}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold shrink-0"
                style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3a2 2 0 00-2 2v16l9-5 9 5V5a2 2 0 00-2-2H5z" />
                </svg>
                Save Search
              </button>
            )}

            {/* View toggle */}
            <div className="flex items-center rounded-xl border overflow-hidden shrink-0"
              style={{ borderColor: "#e2e8f0", backgroundColor: "#ffffff" }}>
              <button onClick={() => setViewMode("grid")}
                className="px-3 py-2 transition-all"
                style={viewMode === "grid"
                  ? { backgroundColor: "#1d4ed8", color: "#faf8f4" }
                  : { backgroundColor: "transparent", color: "#94a3b8" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button onClick={() => setViewMode("list")}
                className="px-3 py-2 transition-all"
                style={viewMode === "list"
                  ? { backgroundColor: "#1d4ed8", color: "#faf8f4" }
                  : { backgroundColor: "transparent", color: "#94a3b8" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-xs font-semibold hidden sm:block" style={{ color: "#64748b" }}>Sort:</label>
              <select value={sort} onChange={(e) => setSort(e.target.value)}
                className="text-sm rounded-xl border px-3 py-2 outline-none"
                style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#1e293b" }}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {saveStatus && (
            <p className="text-xs font-semibold mb-3" style={{ color: saveStatus.includes('Unable') ? '#dc2626' : '#16a34a' }}>
              {saveStatus}
            </p>
          )}

          {/* ── Active filter chips ── */}
          {activeChips.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {activeChips.map((chip) => (
                <span key={chip.key}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                  style={{ backgroundColor: "#eff6ff", borderColor: "#bfdbfe", color: "#1d4ed8" }}>
                  {chip.label}
                  <button onClick={chip.onRemove} className="transition-opacity hover:opacity-60">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <button onClick={clearFilters}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#ef4444" }}>
                Clear all
              </button>
            </div>
          )}

          {/* ── Items ── */}
          {loading ? (
            <div className={viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              : "flex flex-col gap-3"}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl animate-pulse overflow-hidden" style={{ backgroundColor: "#e8e4dc" }}>
                  <div className={viewMode === "grid" ? "h-44" : "h-28"} style={{ backgroundColor: "#d4cfc6" }} />
                  <div className="p-4 space-y-2">
                    <div className="h-3 rounded w-3/4" style={{ backgroundColor: "#d4cfc6" }} />
                    <div className="h-3 rounded w-1/2" style={{ backgroundColor: "#d4cfc6" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : paginated.length > 0 ? (
            user && !mine ? (
              <div className="flex flex-col gap-8">
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold" style={{ color: "#1e293b" }}>Your Products</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                      {paginatedOwn.length}
                    </span>
                  </div>
                  {paginatedOwn.length > 0 ? (
                    <div className={viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                      : "flex flex-col gap-3"}>
                      {paginatedOwn.map((item) => (
                        <ItemCard
                          key={item._id}
                          item={item}
                          viewMode={viewMode}
                          isWishlisted={wishlistedIds.has(item._id)}
                          onWishlistChange={handleWishlistChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border px-4 py-6 text-sm" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#64748b" }}>
                      No products from you on this page.
                    </div>
                  )}
                </section>

                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold" style={{ color: "#1e293b" }}>Other Products</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
                      {paginatedOthers.length}
                    </span>
                  </div>
                  {paginatedOthers.length > 0 ? (
                    <div className={viewMode === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                      : "flex flex-col gap-3"}>
                      {paginatedOthers.map((item) => (
                        <ItemCard
                          key={item._id}
                          item={item}
                          viewMode={viewMode}
                          isWishlisted={wishlistedIds.has(item._id)}
                          onWishlistChange={handleWishlistChange}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border px-4 py-6 text-sm" style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#64748b" }}>
                      No products from other sellers on this page.
                    </div>
                  )}
                </section>
              </div>
            ) : (
              <div className={viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
                : "flex flex-col gap-3"}>
                {paginated.map((item) => (
                  <ItemCard
                    key={item._id}
                    item={item}
                    viewMode={viewMode}
                    isWishlisted={wishlistedIds.has(item._id)}
                    onWishlistChange={handleWishlistChange}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#dbeafe" }}>
                <svg className="w-8 h-8" style={{ color: "#1d4ed8" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                </svg>
              </div>
              <p className="font-bold text-base" style={{ color: "#1e293b" }}>No items found</p>
              <p className="text-sm mt-1 mb-5" style={{ color: "#64748b" }}>Try adjusting your search or filters.</p>
              {hasActiveFilters && (
                <button onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold hover:-translate-y-0.5 transition-all"
                  style={{ backgroundColor: "#1d4ed8", color: "#faf8f4" }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
              {/* Prev */}
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Prev
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const show = p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                const isDot = !show && (p === 2 || p === totalPages - 1);
                if (isDot) return <span key={p} className="text-sm px-1" style={{ color: "#94a3b8" }}>…</span>;
                if (!show) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className="w-9 h-9 rounded-xl text-sm font-bold border transition-all"
                    style={page === p
                      ? { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8", color: "#faf8f4" }
                      : { backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" }}>
                    {p}
                  </button>
                );
              })}

              {/* Next */}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl border text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#475569" }}>
                Next
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile Filter Drawer ── */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0" style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
            onClick={() => setSidebarOpen(false)} />
          <div className="relative ml-auto w-72 h-full overflow-y-auto p-5"
            style={{ backgroundColor: "#ffffff" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-extrabold text-base" style={{ color: "#1e293b" }}>Filters</h3>
              <button onClick={() => setSidebarOpen(false)} style={{ color: "#94a3b8" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}