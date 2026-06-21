import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate, Link } from "react-router-dom";
import { User, Car, Clock, MapPin, Navigation, Calendar, ArrowLeft, LogOut, Star, RefreshCw, Search, Trash2, Shield, Heart, History, Zap, Trophy, Users, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import moment from "moment";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rides, setRides] = useState([]);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [tab, setTab] = useState("scheduled");
  const [loading, setLoading] = useState(true);
  const [isDriver, setIsDriver] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [monthFilter, setMonthFilter] = useState("all");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) { setLoading(false); return; }
      const u = await base44.auth.me();
      setUser(u);
      const allRides = await base44.entities.Ride.filter({ passenger_email: u.email }, "-created_date", 30);
      setRides(allRides.filter((r) => !r.scheduled_time));
      setScheduledRides(allRides.filter((r) => r.scheduled_time));
      const drivers = await base44.entities.Driver.filter({ email: u.email, status: "approved" });
      setIsDriver(drivers.length > 0);
    } catch {}
    setLoading(false);
  }

  const handlePullRefresh = useCallback(async () => { await loadData(); }, []);
  const { pullY, refreshing: pullRefreshing } = usePullToRefresh(handlePullRefresh);

  async function cancelScheduled(ride) {
    await base44.entities.Ride.update(ride.id, { status: "cancelled" });
    setScheduledRides((prev) => prev.map((r) => r.id === ride.id ? { ...r, status: "cancelled" } : r));
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <User className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign in to view your profile</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl mt-2">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {showDeleteDialog && <DeleteAccountDialog onClose={() => setShowDeleteDialog(false)} />}
      <PullToRefreshIndicator pullY={pullY} refreshing={pullRefreshing} />
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">My Profile</h1>
        <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="rounded-xl text-muted-foreground">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* User card */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-base">{user.full_name || "Traveller"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            {isDriver && (
              <span className="mt-1 inline-block text-[10px] bg-safe/10 text-safe font-semibold px-2 py-0.5 rounded-full">
                ✓ Verified Driver
              </span>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl border border-danger/20 bg-danger/5 text-danger text-sm font-medium select-none"
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left text-xs">Delete Account</span>
          <span className="text-[10px] text-danger/60">Irreversible</span>
        </button>

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { to: "/guardian-mode", icon: Shield, label: "Guardian Mode", desc: "Safety timer", color: "text-primary" },
            { to: "/emergency-profile", icon: Heart, label: "Emergency Profile", desc: "Medical info", color: "text-danger" },
            { to: "/trip-history", icon: History, label: "Trip History", desc: "All your rides", color: "text-safe" },
            { to: "/emergency-dashboard", icon: Zap, label: "Emergency Map", desc: "Active alerts", color: "text-caution" },
            { to: "/family-safety", icon: Users, label: "Family Safety", desc: "Guardians & family", color: "text-purple-500" },
            { to: "/safe-places", icon: Map, label: "Safe Places", desc: "Nearby safety", color: "text-blue-500" },
          ].map(({ to, icon: Icon, label, desc, color }) => (
            <Link key={to} to={to}>
              <div className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
                <Icon className={cn("w-5 h-5 shrink-0", color)} />
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate">{label}</p>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Driver dashboard link */}
        {isDriver && (
          <div className="space-y-2">
            <Link to="/driver-dashboard">
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                <Car className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Driver Dashboard</p>
                  <p className="text-xs text-muted-foreground">View requests, earnings & status</p>
                </div>
                <span className="text-xs text-primary">Open →</span>
              </div>
            </Link>
            <Link to="/drivers-leaderboard">
              <div className="rounded-2xl bg-caution/5 border border-caution/20 p-3 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-caution shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">Drivers Leaderboard</p>
                  <p className="text-xs text-muted-foreground">Top-rated drivers</p>
                </div>
                <span className="text-xs text-caution">View →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1">
          {[
            { id: "scheduled", label: `Scheduled (${scheduledRides.length})` },
            { id: "history", label: `Ride History (${rides.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-colors",
                tab === t.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}>{t.label}</button>
          ))}
        </div>

        {/* Scheduled Rides */}
        {tab === "scheduled" && (
          <div className="space-y-3">
            {scheduledRides.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scheduled rides</p>
                <p className="text-xs mt-1">Schedule a ride from the Rides page</p>
              </div>
            )}
            {scheduledRides.map((ride) => (
              <motion.div key={ride.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {moment(ride.scheduled_time).format("ddd, MMM D [at] h:mm A")}
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                    ride.status === "pending" ? "bg-caution/10 text-caution" :
                    ride.status === "accepted" ? "bg-safe/10 text-safe" :
                    ride.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"
                  )}>{ride.status}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-safe shrink-0" />
                  <p className="text-xs truncate">{ride.pickup_location}</p>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-3.5 h-3.5 text-danger shrink-0" />
                  <p className="text-xs truncate">{ride.destination_location}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">₦{(ride.fare_estimate || 0).toLocaleString()}</span>
                  {ride.status === "pending" && (
                    <Button size="sm" variant="outline" onClick={() => cancelScheduled(ride)}
                      className="rounded-xl text-xs text-danger border-danger/30 hover:bg-danger/5 h-7">
                      Cancel
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ride History */}
        {tab === "history" && (
          <div className="space-y-3">
            {/* Search & filter */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  placeholder="Search rides..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none"
              >
                <option value="all">All Time</option>
                {[0,1,2,3,4,5].map((i) => {
                  const m = moment().subtract(i, "months");
                  return <option key={i} value={m.format("YYYY-MM")}>{m.format("MMM YYYY")}</option>;
                })}
              </select>
            </div>

            {/* Stats summary */}
            {rides.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total Rides", value: rides.filter(r => r.status === "completed").length },
                  { label: "Total Spent", value: `₦${rides.filter(r => r.status === "completed").reduce((s, r) => s + (r.fare_estimate || 0), 0).toLocaleString()}` },
                  { label: "Cancelled", value: rides.filter(r => r.status === "cancelled").length },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-card rounded-xl border border-border p-2.5 text-center">
                    <p className="text-sm font-bold">{value}</p>
                    <p className="text-[9px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {rides.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No past rides</p>
              </div>
            ) : (
              rides
                .filter((ride) => {
                  const q = searchQuery.toLowerCase();
                  const matchSearch = !q || ride.pickup_location?.toLowerCase().includes(q) || ride.destination_location?.toLowerCase().includes(q);
                  const matchMonth = monthFilter === "all" || moment(ride.created_date).format("YYYY-MM") === monthFilter;
                  return matchSearch && matchMonth;
                })
                .map((ride) => (
                  <motion.div key={ride.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-card rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                          ride.status === "completed" ? "bg-safe/10 text-safe" :
                          ride.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-muted text-muted-foreground"
                        )}>{ride.status}</span>
                        {ride.ride_type && (
                          <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{ride.ride_type}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-safe">₦{(ride.fare_estimate || 0).toLocaleString()}</span>
                    </div>

                    <div className="space-y-1 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-safe shrink-0" />
                        <p className="text-xs truncate text-muted-foreground">{ride.pickup_location}</p>
                      </div>
                      <div className="ml-1 w-px h-3 bg-border" />
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-danger shrink-0" />
                        <p className="text-xs truncate text-muted-foreground">{ride.destination_location}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <p className="text-[10px] text-muted-foreground">{moment(ride.created_date).format("ddd, MMM D YYYY · h:mm A")}</p>
                      {ride.status === "completed" && (
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={cn("w-2.5 h-2.5", s <= 4 ? "text-caution fill-caution" : "text-muted-foreground")} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}