import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  UserCog,
  Search,
  RefreshCw,
  Radio,
  MapPin,
  X,
  Globe,
  Clock,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useAuthActions } from "../../../context/AuthContext";
import UserTable from "../user/UserTable";
import Pagination from "../../../components/common/Pagination";

interface LiveSessionInfo {
  userId: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  activeSessionCount: number;
  lastActiveAt: string;
  ipAddress?: string | null;
  locationLabel: string;
  userAgent?: string | null;
}

const RAW_VITE_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

const resolveApiBase = (rawUrl: string): string => {
  const isDeployedSite =
    import.meta.env.PROD ||
    (typeof window !== "undefined" &&
      window.location.hostname === "ingeni.onrender.com");

  if (isDeployedSite) {
    return "/api";
  }

  if (!rawUrl) {
    return "https://ingeri-api.onrender.com/api";
  }

  return rawUrl.endsWith("/api") ? rawUrl : `${rawUrl}/api`;
};

const API_BASE = resolveApiBase(RAW_VITE_API_URL);

const buildUsersUrl = (subPath: string) => {
  const cleanBase = API_BASE.replace(/\/+$/, "");
  const cleanSub = subPath.startsWith("/") ? subPath : `/${subPath}`;
  return cleanBase.endsWith("/api")
    ? `${cleanBase}/users${cleanSub}`
    : `${cleanBase}/api/users${cleanSub}`;
};

const UserManagementPage = () => {
  const authContext = useAuthActions() as any;
  const { admin } = authContext;
  const currentSessionUser =
    authContext?.user ||
    authContext?.session?.user ||
    authContext?.currentUser ||
    null;

  const ITEMS_PER_PAGE = 10;

  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [liveOnly, setLiveOnly] = useState(false);
  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [liveList, setLiveList] = useState<LiveSessionInfo[]>([]);
  const [liveSessionsCount, setLiveSessionsCount] = useState(0);
  const [sessionEndpointNote, setSessionEndpointNote] = useState<string>("");
  const sessionAbortRef = useRef<AbortController | null>(null);

  const [query, setQuery] = useState<{
    limit: number;
    offset: number;
    searchField: "name" | "email";
    searchValue: string;
  }>({
    limit: ITEMS_PER_PAGE,
    offset: 0,
    searchField: "name",
    searchValue: "",
  });

  const buildFallbackSession = useCallback((): LiveSessionInfo[] => {
    if (!currentSessionUser?.id) return [];
    return [
      {
        userId: currentSessionUser.id,
        name: currentSessionUser.name || null,
        email: currentSessionUser.email || null,
        role: currentSessionUser.role || "admin",
        activeSessionCount: 1,
        lastActiveAt: new Date().toISOString(),
        ipAddress: null,
        locationLabel:
          Intl.DateTimeFormat().resolvedOptions().timeZone || "Active Session",
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : null,
      },
    ];
  }, [currentSessionUser]);

  const loadLiveSessions = useCallback(async () => {
    sessionAbortRef.current?.abort();
    const controller = new AbortController();
    sessionAbortRef.current = controller;

    setSessionEndpointNote("");
    try {
      const endpoint = `${buildUsersUrl("/live-sessions")}?windowMinutes=60`;
      const res = await fetch(endpoint, {
        credentials: "include",
        signal: controller.signal,
      });

      if (!res.ok) {
        const fallbackList = buildFallbackSession();
        setLiveList(fallbackList);
        setLiveSessionsCount(fallbackList.length);
        setSessionEndpointNote(
          `Endpoint ${endpoint} returned HTTP ${res.status} — showing active cookie session fallback.`,
        );
        return;
      }

      const payload = await res.json();
      const sessionData = payload?.data ?? payload;
      const list: any[] = Array.isArray(sessionData?.liveUsers)
        ? sessionData.liveUsers
        : [];

      const normalized = list
        .map((entry) => {
          const uid = entry?.user?.id || entry?.userId;
          if (!uid) return null;
          return {
            userId: uid,
            name: entry?.user?.name ?? entry?.name ?? null,
            email: entry?.user?.email ?? entry?.email ?? null,
            role: entry?.user?.role ?? entry?.role ?? "user",
            activeSessionCount: Number(entry.activeSessionCount || 1),
            lastActiveAt: entry.lastActiveAt || new Date().toISOString(),
            ipAddress: entry.ipAddress ?? entry.latestSession?.ipAddress ?? null,
            locationLabel:
              entry.locationLabel ||
              entry.location ||
              (entry.ipAddress ? `IP ${entry.ipAddress}` : "Active Session"),
            userAgent:
              entry.userAgent ?? entry.latestSession?.userAgent ?? null,
          };
        })
        .filter(
          (x): x is NonNullable<typeof x> => Boolean(x),
        ) as LiveSessionInfo[];

      if (normalized.length === 0 && currentSessionUser?.id) {
        const fallbackList = buildFallbackSession();
        setLiveList(fallbackList);
        setLiveSessionsCount(fallbackList.length);
        setSessionEndpointNote(
          "Session query returned 0 active rows; displaying your current authenticated session.",
        );
      } else {
        setLiveList(normalized);
        setLiveSessionsCount(
          typeof sessionData?.totalActiveSessions === "number"
            ? sessionData.totalActiveSessions
            : normalized.reduce((acc, item) => acc + item.activeSessionCount, 0),
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Failed to fetch live sessions:", err);
      const fallbackList = buildFallbackSession();
      setLiveList(fallbackList);
      setLiveSessionsCount(fallbackList.length);
      setSessionEndpointNote(
        err?.message || "Could not reach /users/live-sessions endpoint.",
      );
    }
  }, [buildFallbackSession, currentSessionUser]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [res] = await Promise.all([
        admin.listUsers(query),
        loadLiveSessions(),
      ]);

      const responseData = res?.data || res;
      setUsers(responseData?.users || []);
      setTotal(
        typeof responseData?.total === "number"
          ? responseData.total
          : (responseData?.users || []).length,
      );
    } catch (err) {
      console.error("Critical Registry Sync Failure:", err);
    } finally {
      setLoading(false);
    }
  }, [admin, query, loadLiveSessions]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      void loadUsers();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [loadUsers]);

  useEffect(() => {
    const interval = setInterval(() => {
      void loadLiveSessions();
    }, 30000);
    return () => {
      clearInterval(interval);
      sessionAbortRef.current?.abort();
    };
  }, [loadLiveSessions]);

  const liveByUserId = useMemo(() => {
    const map: Record<string, LiveSessionInfo> = {};
    for (const item of liveList) {
      map[item.userId] = item;
    }
    return map;
  }, [liveList]);

  const enrichedUsers = useMemo(() => {
    const merged = users.map((u) => {
      const liveInfo = liveByUserId[u.id];
      return {
        ...u,
        isLive: Boolean(liveInfo),
        liveSession: liveInfo || null,
      };
    });

    return liveOnly ? merged.filter((u) => u.isLive) : merged;
  }, [users, liveByUserId, liveOnly]);

  const locationChartData = useMemo(() => {
    const counts = new Map<
      string,
      { location: string; users: number; sessions: number }
    >();
    for (const item of liveList) {
      const loc = item.locationLabel || "Unknown";
      const existing = counts.get(loc) || {
        location: loc,
        users: 0,
        sessions: 0,
      };
      existing.users += 1;
      existing.sessions += item.activeSessionCount;
      counts.set(loc, existing);
    }
    return Array.from(counts.values());
  }, [liveList]);

  const userSessionChartData = useMemo(() => {
    return liveList.map((item) => {
      const matched = users.find((u) => u.id === item.userId);
      const label =
        item.name ||
        matched?.name ||
        item.email ||
        matched?.email ||
        item.userId.slice(0, 8);
      return {
        user: label.length > 14 ? `${label.slice(0, 14)}…` : label,
        sessions: item.activeSessionCount,
      };
    });
  }, [liveList, users]);

  const liveUsersCount = liveList.length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setQuery((prev) => ({
      ...prev,
      offset: (page - 1) * ITEMS_PER_PAGE,
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Cluster */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 text-blue-500">
            <UserCog size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              Security Protocol
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-white uppercase">
            User Registry
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Live database identities, active cookie sessions, and authentication
            records.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/5 p-2 rounded-2xl shadow-inner">
          <div className="px-4 py-2 border-r border-white/5">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
              Population
            </p>
            <p className="text-xl font-mono font-bold text-blue-500">
              {total.toLocaleString()}
            </p>
          </div>

          {/* Clickable Live Users Card -> Opens Live Presence & Location Chart Modal */}
          <button
            type="button"
            onClick={() => {
              void loadLiveSessions();
              setLiveModalOpen(true);
            }}
            className="px-4 py-2 border-r border-white/5 text-left rounded-xl hover:bg-emerald-500/10 transition cursor-pointer group"
            title="Click to inspect live users and location chart"
          >
            <p className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Users
            </p>
            <p className="text-xl font-mono font-bold text-emerald-400 group-hover:underline">
              {liveUsersCount}{" "}
              <span className="text-[10px] text-gray-500 font-normal">
                ({liveSessionsCount} sess)
              </span>
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              void loadUsers();
            }}
            className="p-4 hover:bg-white/5 rounded-xl transition-all text-gray-400 hover:text-white cursor-pointer"
            title="Refresh from database"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Control Interface */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative group">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-blue-500 transition-colors"
            size={18}
          />
          <input
            value={query.searchValue}
            placeholder={`Filter by ${query.searchField}...`}
            className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm focus:border-blue-500/30 outline-none text-white transition-all shadow-sm"
            onChange={(e) => {
              setCurrentPage(1);
              setQuery((prev) => ({
                ...prev,
                offset: 0,
                searchValue: e.target.value,
              }));
            }}
          />
        </div>

        <select
          value={query.searchField}
          className="bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none focus:border-blue-500/30 appearance-none cursor-pointer"
          onChange={(e) => {
            const nextField = e.target.value === "email" ? "email" : "name";
            setCurrentPage(1);
            setQuery((prev) => ({
              ...prev,
              offset: 0,
              searchField: nextField,
            }));
          }}
        >
          <option value="name">Identity Name</option>
          <option value="email">Electronic Mail</option>
        </select>

        <button
          type="button"
          onClick={() => {
            setCurrentPage(1);
            setLiveOnly((prev) => !prev);
          }}
          className={`rounded-2xl px-5 py-4 text-[10px] font-black uppercase tracking-widest border transition flex items-center justify-center gap-2 cursor-pointer ${
            liveOnly
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              : "bg-[#0a0a0a] border-white/5 text-gray-400 hover:text-white"
          }`}
        >
          <Radio size={14} className={liveOnly ? "animate-pulse" : ""} />
          {liveOnly ? "Showing Live Only" : "Filter Live Users"}
        </button>
      </section>

      {/* Main Table Container */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <UserTable
          users={enrichedUsers}
          loading={loading}
          refresh={loadUsers}
        />

        <Pagination
          totalItems={liveOnly ? enrichedUsers.length : total}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isLoading={loading}
        />
      </div>

      {/* Live Users & Location Chart Modal */}
      {liveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div
            className="absolute inset-0"
            onClick={() => setLiveModalOpen(false)}
          />

          <div className="relative z-10 w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden max-h-[88vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-tight">
                    Live Users &amp; Session Locations
                  </h3>
                  <p className="text-xs text-gray-500">
                    {liveUsersCount} live user(s) across {liveSessionsCount}{" "}
                    active session(s)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLiveOnly(true);
                    setLiveModalOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-semibold cursor-pointer"
                >
                  Filter Table to Live
                </button>
                <button
                  type="button"
                  onClick={() => setLiveModalOpen(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {sessionEndpointNote && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                  {sessionEndpointNote}
                </div>
              )}

              {liveList.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-sm">
                  No active sessions returned by the live session query.
                </div>
              ) : (
                <>
                  {/* Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        <Globe size={14} className="text-emerald-400" />
                        Live Users by Location
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={locationChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                            />
                            <XAxis
                              dataKey="location"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#050505",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "0.75rem",
                                fontSize: "11px",
                              }}
                            />
                            <Bar
                              dataKey="users"
                              name="Live Users"
                              fill="#10b981"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        <Radio size={14} className="text-blue-400" />
                        Sessions per Live User
                      </div>
                      <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userSessionChartData}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#ffffff10"
                            />
                            <XAxis
                              dataKey="user"
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              stroke="#71717a"
                              fontSize={10}
                              tickLine={false}
                            />
                            <Tooltip
                              contentStyle={{
                                background: "#050505",
                                border: "1px solid rgba(255,255,255,0.12)",
                                borderRadius: "0.75rem",
                                fontSize: "11px",
                              }}
                            />
                            <Bar
                              dataKey="sessions"
                              name="Active Sessions"
                              fill="#3b82f6"
                              radius={[6, 6, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Live Users List */}
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Currently Live Identities ({liveList.length})
                    </h4>
                    <div className="divide-y divide-white/5 border border-white/5 rounded-2xl bg-black/30">
                      {liveList.map((item) => {
                        const matched = users.find((u) => u.id === item.userId);
                        const displayName =
                          item.name || matched?.name || "Authenticated User";
                        const displayEmail =
                          item.email || matched?.email || item.userId;

                        return (
                          <div
                            key={item.userId}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                              <div>
                                <p className="font-bold text-white">
                                  {displayName}
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono">
                                  {displayEmail}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-mono">
                              <span className="inline-flex items-center gap-1 text-emerald-300">
                                <MapPin size={12} /> {item.locationLabel}
                              </span>
                              <span>{item.activeSessionCount} session(s)</span>
                              <span className="inline-flex items-center gap-1 text-gray-500">
                                <Clock size={12} />
                                {new Date(
                                  item.lastActiveAt,
                                ).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;