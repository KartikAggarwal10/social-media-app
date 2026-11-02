"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getFollowRequestsAction,
  getSuggestedUsersAction,
  acceptFollowAction,
  cancelFollowAction,
  sendFollowRequestAction,
  userForSearchAction,
} from "../app/actions/users";
import { useAuth } from "../context/AuthContext";

// ─── Reusable infinite-scroll hook ──────────────────────────────────────────
function useInfiniteScroll(loading, hasMore, onLoadMore) {
  const observer = useRef();

  const lastElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, onLoadMore]
  );

  return lastElementRef;
}

// ─── Skeleton loader card ───────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#111827] rounded-2xl animate-pulse">
      <div className="w-12 h-12 rounded-full bg-white/10" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-28 bg-white/10 rounded" />
        <div className="h-3 w-20 bg-white/5 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 bg-white/10 rounded-xl" />
        <div className="h-9 w-20 bg-white/10 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function DiscoverPeople() {
  // ── Auth
  const { userId } = useAuth();
  const currentUserId = userId;

  // ── Follow Requests State
  const [requests, setRequests] = useState([]);
  const [reqPage, setReqPage] = useState(1);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqHasMore, setReqHasMore] = useState(true);

  // ── Suggested Users State
  const [suggestions, setSuggestions] = useState([]);
  const [sugPage, setSugPage] = useState(1);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugHasMore, setSugHasMore] = useState(true);

  // ── Track button loading states per user
  const [actionLoading, setActionLoading] = useState({});

  // ── Search State
  const [search, setSearch] = useState("");
  const [searchRes, setSearchRes] = useState([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHasMore, setSearchHasMore] = useState(true);

  // ── Search useEffect with debounce ───────────────────────────────────────
  useEffect(() => {
    // Clear results when search is empty
    if (!search.trim()) {
      setSearchRes([]);
      setSearchPage(1);
      setSearchHasMore(true);
      return;
    }

    const timeout = setTimeout(() => {
      // Reset for new search term
      setSearchPage(1);
      setSearchHasMore(true);

      const fetchSearchResults = async () => {
        setSearchLoading(true);
        try {
          const res = await userForSearchAction( search, 1, 8);
          if (res.users.length === 0) {
            setSearchRes([]);
            setSearchHasMore(false);
          } else {
            setSearchRes(res.users);
            setSearchHasMore(res.hasMore);
          }
        } catch (err) {
          console.error("Failed to search users:", err);
        } finally {
          setSearchLoading(false);
        }
      };
      fetchSearchResults();
    }, 500); // 500ms debounce instead of 2000ms which is too long

    return () => clearTimeout(timeout);
  }, [search, currentUserId]);

  // ── Load more search results when searchPage increases ──────────────────
  useEffect(() => {
    if (searchPage === 1 || !search.trim()) return;

    const fetchMore = async () => {
      setSearchLoading(true);
      try {
        const res = await userForSearchAction( search, searchPage, 8);
        if (res.users.length === 0) {
          setSearchHasMore(false);
        } else {
          setSearchRes((prev) => {
            const existingIds = new Set(prev.map((u) => u.userId));
            const filtered = res.users.filter((u) => !existingIds.has(u.userId));
            return [...prev, ...filtered];
          });
          setSearchHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch more search results:", err);
      } finally {
        setSearchLoading(false);
      }
    };
    fetchMore();
  }, [searchPage, currentUserId, search]);

  // ── Fetch follow requests ─────────────────────────────────────────────────
  useEffect(() => {
    const fetchRequests = async () => {
      setReqLoading(true);
      try {
        const res = await getFollowRequestsAction(reqPage, 8);
        if (res.users.length === 0) {
          setReqHasMore(false);
        } else {
          setRequests((prev) => {
            const existingIds = new Set(prev.map((u) => u.userId));
            const filtered = res.users.filter((u) => !existingIds.has(u.userId));
            return [...prev, ...filtered];
          });
          setReqHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch requests:", err);
      } finally {
        setReqLoading(false);
      }
    };
    fetchRequests();
  }, [reqPage, currentUserId]);

  // ── Fetch suggestions ─────────────────────────────────────────────────────
  useEffect(() => {
    const fetchSuggestions = async () => {
      setSugLoading(true);
      try {
        const res = await getSuggestedUsersAction( sugPage, 8);
        if (res.users.length === 0) {
          setSugHasMore(false);
        } else {
          setSuggestions((prev) => {
            const existingIds = new Set(prev.map((u) => u.userId));
            const filtered = res.users.filter((u) => !existingIds.has(u.userId));
            return [...prev, ...filtered];
          });
          setSugHasMore(res.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setSugLoading(false);
      }
    };
    fetchSuggestions();
  }, [sugPage, currentUserId]);

  // ── Infinite scroll refs ──────────────────────────────────────────────────
  const lastRequestRef = useInfiniteScroll(reqLoading, reqHasMore, () =>
    setReqPage((p) => p + 1)
  );
  const lastSuggestionRef = useInfiniteScroll(sugLoading, sugHasMore, () =>
    setSugPage((p) => p + 1)
  );
  const lastSearchRef = useInfiniteScroll(searchLoading, searchHasMore, () =>
    setSearchPage((p) => p + 1)
  );

  // ── Action Handlers ───────────────────────────────────────────────────────

  const handleAccept = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: "accepting" }));
    await acceptFollowAction( targetUserId);
    setRequests((prev) => prev.filter((u) => u.userId !== targetUserId));
    setActionLoading((prev) => ({ ...prev, [targetUserId]: null }));
  };

  const handleDecline = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: "declining" }));
    await cancelFollowAction(targetUserId, undefined, "request");
    setRequests((prev) => prev.filter((u) => u.userId !== targetUserId));
    setActionLoading((prev) => ({ ...prev, [targetUserId]: null }));
  };

  const handleFollow = async (targetUserId) => {
    setActionLoading((prev) => ({ ...prev, [targetUserId]: "following" }));
    await sendFollowRequestAction(targetUserId);
    // Mark as "requested" in UI instead of removing
    setSuggestions((prev) =>
      prev.map((u) =>
        u.userId === targetUserId ? { ...u, requested: true } : u
      )
    );
    // Also mark in search results if present
    setSearchRes((prev) =>
      prev.map((u) =>
        u.userId === targetUserId ? { ...u, requested: true } : u
      )
    );
    setActionLoading((prev) => ({ ...prev, [targetUserId]: null }));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen bg-[#060e1f] text-white">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="w-full mb-6 px-4 py-3 bg-[#111827] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 transition"
      />

      {search.trim() ? (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* SEARCH RESULTS VIEW                                               */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="mb-10">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-7 bg-blue-500 rounded-full" />
            <h2 className="text-xl font-bold tracking-tight">Search Results</h2>
            {searchRes.length > 0 && (
              <span className="ml-2 px-2.5 py-0.5 bg-blue-600/30 text-blue-300 text-xs font-bold rounded-full">
                {searchRes.length}
              </span>
            )}
          </div>

          {/* Search Result Cards */}
          <div className="flex flex-col gap-3">
            {searchRes.map((user, index) => {
              const isLast = index === searchRes.length - 1;
              const loading = actionLoading[user.userId];

              return (
                <div
                  key={user.userId}
                  ref={isLast ? lastSearchRef : null}
                  className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#111827] to-[#0f172a] border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all duration-300 group"
                >
                  {/* Avatar */}
                  <img
                    src={user.dp || "/user.png"}
                    alt={user.userName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-500/20 group-hover:border-blue-500/50 transition"
                  />

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{user.userName}</p>
                  </div>

                  {/* Follow / Requested Button */}
                  <div className="shrink-0">
                    {user.requested ? (
                      <button
                        disabled
                        className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-sm font-semibold border border-white/5 cursor-default"
                      >
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => handleFollow(user.userId)}
                        disabled={!!loading}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-600/40 active:scale-95"
                      >
                        {loading === "following" ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Follow"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading skeletons */}
            {searchLoading && (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            )}

            {/* Empty state */}
            {!searchLoading && searchRes.length === 0 && (
              <div className="text-center py-8 text-gray-600 bg-[#111827]/50 rounded-2xl border border-white/5">
                <div className="text-3xl mb-2">🔍</div>
                <p className="text-sm">No users found for &quot;{search}&quot;</p>
              </div>
            )}

            {/* End of list */}
            {!searchLoading && !searchHasMore && searchRes.length > 0 && (
              <div className="text-center py-2 text-gray-600 text-xs">
                — All results loaded —
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* NORMAL VIEW: REQUESTS + SUGGESTIONS                               */
        /* ═══════════════════════════════════════════════════════════════════ */
        <>
          {/* ─── SECTION 1: FOLLOW REQUESTS ─────────────────────────────── */}
          <div className="mb-10">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-violet-500 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">Follow Requests</h2>
              {requests.length > 0 && (
                <span className="ml-2 px-2.5 py-0.5 bg-violet-600/30 text-violet-300 text-xs font-bold rounded-full">
                  {requests.length}
                </span>
              )}
            </div>

            {/* Request Cards */}
            <div className="flex flex-col gap-3">
              {requests.map((user, index) => {
                const isLast = index === requests.length - 1;
                const loading = actionLoading[user.userId];

                return (
                  <div
                    key={user.userId}
                    ref={isLast ? lastRequestRef : null}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#111827] to-[#0f172a] border border-white/5 rounded-2xl hover:border-violet-500/20 transition-all duration-300 group"
                    
                  >
                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={user.dp || "/user.png"}
                        alt={user.userName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-violet-500/30 group-hover:border-violet-500/60 transition"
                      />
                      <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-[#111827]" />
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user.userName}</p>
                      <p className="text-xs text-gray-500">wants to follow you</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleAccept(user.userId)}
                        disabled={!!loading}
                        className="px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-900/30 hover:shadow-violet-600/40 active:scale-95"
                      >
                        {loading === "accepting" ? (
                          <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Accept"
                        )}
                      </button>
                      <button
                        onClick={() => handleDecline(user.userId)}
                        disabled={!!loading}
                        className="px-4 py-2 bg-white/5 hover:bg-red-500/15 text-gray-400 hover:text-red-400 disabled:opacity-50 rounded-xl text-sm font-semibold transition-all border border-white/5 hover:border-red-500/20 active:scale-95"
                      >
                        {loading === "declining" ? (
                          <span className="inline-block w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin" />
                        ) : (
                          "Decline"
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Loading skeletons */}
              {reqLoading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}

              {/* Empty state */}
              {!reqLoading && requests.length === 0 && (
                <div className="text-center py-8 text-gray-600 bg-[#111827]/50 rounded-2xl border border-white/5">
                  <div className="text-3xl mb-2">✨</div>
                  <p className="text-sm">No pending follow requests</p>
                </div>
              )}

              {/* End of list */}
              {!reqLoading && !reqHasMore && requests.length > 0 && (
                <div className="text-center py-2 text-gray-600 text-xs">
                  — All requests loaded —
                </div>
              )}
            </div>
          </div>

          {/* ─── DIVIDER ────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs text-gray-500 font-medium tracking-widest uppercase">
              People you may know
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* ─── SECTION 2: SMART SUGGESTIONS ───────────────────────────── */}
          <div>
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1.5 h-7 bg-emerald-500 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">Suggested for You</h2>
            </div>

            {/* Suggestion Cards */}
            <div className="flex flex-col gap-3">
              {suggestions.map((user, index) => {
                const isLast = index === suggestions.length - 1;
                const loading = actionLoading[user.userId];

                return (
                  <div
                    key={user.userId}
                    ref={isLast ? lastSuggestionRef : null}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#111827] to-[#0f172a] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group"
                  >
                    {/* Avatar */}
                    <img
                      src={user.dp || "/user.png"}
                      alt={user.userName}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/20 group-hover:border-emerald-500/50 transition"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{user.userName}</p>
                      <p className="text-xs text-gray-500">Suggested based on your network</p>
                    </div>

                    {/* Follow / Requested Button */}
                    <div className="shrink-0">
                      {user.requested ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-white/5 text-gray-500 rounded-xl text-sm font-semibold border border-white/5 cursor-default"
                        >
                          Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => handleFollow(user.userId)}
                          disabled={!!loading}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-600/40 active:scale-95"
                        >
                          {loading === "following" ? (
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            "Follow"
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading skeletons */}
              {sugLoading && (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              )}

              {/* Empty state */}
              {!sugLoading && suggestions.length === 0 && (
                <div className="text-center py-8 text-gray-600 bg-[#111827]/50 rounded-2xl border border-white/5">
                  <div className="text-3xl mb-2">🌐</div>
                  <p className="text-sm">No suggestions right now — follow more people to discover connections!</p>
                </div>
              )}

              {/* End of list */}
              {!sugLoading && !sugHasMore && suggestions.length > 0 && (
                <div className="text-center py-4 text-gray-600 text-xs">
                  — End of suggestions —
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
