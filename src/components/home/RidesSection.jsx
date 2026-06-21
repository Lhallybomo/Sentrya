import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Clock, CalendarDays, MapPin, Navigation, ChevronRight, Star } from "lucide-react";

const FAVORITES = [
  { label: "Lagos Island", icon: "🏙️" },
  { label: "Abuja Airport", icon: "✈️" },
  { label: "Victoria Island", icon: "🌊" },
  { label: "Lekki Phase 1", icon: "🏡" },
];

export default function RidesSection({ recentRides = [] }) {
  const activeRide = recentRides.find((r) => r.status === "accepted" || r.status === "in_progress");
  const lastRide = recentRides.find((r) => r.status === "completed");

  return (
    <section className="px-4 py-5 bg-secondary/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Car className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Rides</h2>
            <p className="text-[10px] text-muted-foreground">Book, schedule & track</p>
          </div>
        </div>
        <Link to="/rides" className="flex items-center gap-1 text-xs text-primary font-medium">
          Open <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Active ride alert */}
      {activeRide && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 bg-primary/10 border border-primary/20 rounded-2xl p-3"
        >
          <p className="text-[10px] font-bold text-primary mb-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active Ride
          </p>
          <div className="flex items-center gap-1.5 mb-0.5">
            <MapPin className="w-3 h-3 text-safe" />
            <p className="text-xs truncate">{activeRide.pickup_location}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-danger" />
            <p className="text-xs truncate">{activeRide.destination_location}</p>
          </div>
        </motion.div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { to: "/rides", icon: Car, label: "Book Now", bg: "bg-primary text-primary-foreground", shadow: "shadow-primary/20" },
          { to: "/rides?tab=scheduled", icon: CalendarDays, label: "Schedule", bg: "bg-card border border-border", shadow: "" },
          { to: "/profile?tab=history", icon: Clock, label: "History", bg: "bg-card border border-border", shadow: "" },
        ].map(({ to, icon: Icon, label, bg, shadow }) => (
          <Link key={to} to={to}>
            <div className={`${bg} ${shadow} rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center shadow-sm`}>
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-semibold">{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Favourite destinations */}
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Favourite Destinations</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FAVORITES.map((f) => (
          <Link key={f.label} to="/rides">
            <div className="shrink-0 bg-card border border-border rounded-2xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <span className="text-lg">{f.icon}</span>
              <span className="text-xs font-medium whitespace-nowrap">{f.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Last ride */}
      {lastRide && (
        <div className="mt-3 bg-card rounded-2xl border border-border p-3">
          <p className="text-[10px] text-muted-foreground font-semibold mb-2">LAST RIDE</p>
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3 h-3 text-safe" />
            <p className="text-xs truncate">{lastRide.pickup_location}</p>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-3 h-3 text-danger" />
            <p className="text-xs truncate">{lastRide.destination_location}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-safe">₦{(lastRide.fare_estimate || 0).toLocaleString()}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? "text-caution fill-caution" : "text-muted-foreground"}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}