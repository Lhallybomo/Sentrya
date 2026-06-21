import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Clock, Star, RefreshCw, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import moment from "moment";
import TripReviewModal from "@/components/rides/TripReviewModal";

const STATUS_STYLES = {
  completed: "bg-safe/10 text-safe",
  cancelled: "bg-danger/10 text-danger",
  in_progress: "bg-primary/10 text-primary",
  accepted: "bg-caution/10 text-caution",
  dispatching: "bg-muted text-muted-foreground",
};

export default function TripHistory() {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState("");
  const [reviewRide, setReviewRide] = useState(null);
  const [reviews, setReviews] = useState({});

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [allRides, allReviews] = await Promise.all([
        base44.entities.Ride.filter({ passenger_email: u.email }, "-created_date", 50),
        base44.entities.TripReview.filter({ passenger_email: u.email }),
      ]);
      setRides(allRides);
      const reviewMap = {};
      allReviews.forEach((r) => { reviewMap[r.ride_id] = r; });
      setReviews(reviewMap);
    } catch {}
    setLoading(false);
  }

  function handleRebook(ride) {
    // Navigate to rides with pre-filled data via URL params
    navigate(`/rides?pickup=${encodeURIComponent(ride.pickup_location)}&dest=${encodeURIComponent(ride.destination_location)}`);
  }

  const filtered = rides.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.pickup_location?.toLowerCase().includes(q) || r.destination_location?.toLowerCase().includes(q);
  });

  const completed = rides.filter((r) => r.status === "completed").length;
  const totalSpent = rides.filter((r) => r.status === "completed").reduce((s, r) => s + (r.fare_estimate || 0), 0);
  const cancelled = rides.filter((r) => r.status === "cancelled").length;

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-sm text-muted-foreground">Sign in to view your trip history</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold flex-1">Trip History</h1>
        <button onClick={init} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        {rides.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Completed", value: completed },
              { label: "Total Spent", value: `₦${totalSpent.toLocaleString()}` },
              { label: "Cancelled", value: cancelled },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-3 text-center">
                <p className="text-base font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pickup or destination…" className="rounded-xl pl-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No trips found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ride, i) => {
              const review = reviews[ride.id];
              return (
                <motion.div key={ride.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card rounded-2xl border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[ride.status] || "bg-muted text-muted-foreground")}>
                        {ride.status}
                      </span>
                      {ride.ride_type && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium capitalize">{ride.ride_type}</span>
                      )}
                      {ride.ride_mode === "along" && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">Along</span>
                      )}
                    </div>
                    <span className="text-sm font-bold text-primary">₦{(ride.fare_estimate || 0).toLocaleString()}</span>
                  </div>

                  <div className="space-y-1.5">
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

                  {ride.driver_name && (
                    <p className="text-xs text-muted-foreground">Driver: <span className="font-medium text-foreground">{ride.driver_name}</span> · {ride.vehicle_info}</p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <p className="text-[10px] text-muted-foreground">{moment(ride.created_date).format("ddd, MMM D YYYY · h:mm A")}</p>
                    <div className="flex items-center gap-2">
                      {review ? (
                        <div className="flex items-center gap-0.5">
                          {[1,2,3,4,5].map((s) => (
                            <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "fill-caution text-caution" : "text-muted-foreground")} />
                          ))}
                        </div>
                      ) : ride.status === "completed" && (
                        <button onClick={() => setReviewRide(ride)}
                          className="text-[10px] text-primary font-semibold hover:underline">Rate trip</button>
                      )}
                      {ride.status === "completed" && (
                        <button onClick={() => handleRebook(ride)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-medium">
                          <RotateCcw className="w-3 h-3" /> Rebook
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {reviewRide && (
        <TripReviewModal ride={reviewRide} onClose={(submitted) => {
          setReviewRide(null);
          if (submitted) init();
        }} />
      )}
    </div>
  );
}