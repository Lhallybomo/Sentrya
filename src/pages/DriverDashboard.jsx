import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Car, CheckCircle2, XCircle, MapPin, Navigation, Clock, DollarSign, Hand, BarChart2, User, Wifi, WifiOff, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LocationSearch from "@/components/rides/LocationSearch";
import ActiveTripView from "@/components/rides/ActiveTripView";

// Driver status badge colors
const STATUS_COLORS = {
  available: "bg-safe/10 text-safe border-safe/30",
  on_trip: "bg-primary/10 text-primary border-primary/30",
  offline: "bg-muted text-muted-foreground border-border",
};

export default function DriverDashboard() {
  const [driver, setDriver] = useState(null);
  const [driverStatus, setDriverStatus] = useState("offline"); // available | on_trip | offline
  const [pendingRides, setPendingRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [alongDestination, setAlongDestination] = useState("");
  const [tab, setTab] = useState("requests"); // requests | along | earnings
  const [loading, setLoading] = useState(true);
  const [startingAlong, setStartingAlong] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    init();
    return () => stopGPS();
  }, []);

  async function init() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const drivers = await base44.entities.Driver.filter({ email: user.email, status: "approved" });
      if (drivers.length > 0) {
        setDriver(drivers[0]);
        setDriverStatus(drivers[0].is_online ? "available" : "offline");
      }
    } catch {}
    setLoading(false);
  }

  // Subscribe to dispatching rides when available
  useEffect(() => {
    if (driverStatus !== "available" || !driver) return;

    loadPendingRides();
    const unsub = base44.entities.Ride.subscribe((event) => {
      if (event.type === "create" && event.data?.status === "dispatching") {
        setPendingRides((prev) => {
          if (prev.find((r) => r.id === event.id)) return prev;
          return [event.data, ...prev];
        });
      } else if (event.type === "update") {
        setPendingRides((prev) => prev.filter((r) => r.id !== event.id));
      }
    });

    return unsub;
  }, [driverStatus, driver?.id]);

  async function loadPendingRides() {
    if (!driver) return;
    const rides = await base44.entities.Ride.filter({ status: "dispatching" }, "-created_date", 20);
    // Exclude rides this driver declined
    const filtered = rides.filter((r) => {
      const declined = (r.declined_drivers || "").split(",").map((e) => e.trim());
      return !declined.includes(driver.email);
    });
    setPendingRides(filtered);
  }

  function startGPS(rideId) {
    if (!navigator.geolocation) return;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        base44.entities.Ride.update(rideId, {
          driver_lat: pos.coords.latitude,
          driver_lng: pos.coords.longitude,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }

  function stopGPS() {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }

  async function handleToggleOnline() {
    if (!driver) return;
    const goOnline = driverStatus === "offline";
    await base44.entities.Driver.update(driver.id, { is_online: goOnline });
    setDriver((d) => ({ ...d, is_online: goOnline }));
    setDriverStatus(goOnline ? "available" : "offline");
  }

  async function handleAccept(ride) {
    if (!driver) return;
    const vehicleInfo = `${driver.vehicle_make} ${driver.vehicle_model} - ${driver.vehicle_color} - ${driver.plate_number}`;
    await base44.entities.Ride.update(ride.id, {
      status: "accepted",
      driver_email: driver.email,
      driver_name: driver.full_name,
      driver_phone: driver.phone,
      vehicle_info: vehicleInfo,
    });
    setPendingRides([]);
    setActiveRide({ ...ride, driver_name: driver.full_name, driver_phone: driver.phone, vehicle_info: vehicleInfo });
    setDriverStatus("on_trip");
    startGPS(ride.id);
    setTab("requests");
  }

  async function handleDecline(ride) {
    const existing = ride.declined_drivers || "";
    const updated = existing ? `${existing},${driver.email}` : driver.email;
    await base44.entities.Ride.update(ride.id, { declined_drivers: updated });
    setPendingRides((prev) => prev.filter((r) => r.id !== ride.id));
  }

  async function handleStartAlong() {
    if (!driver || !alongDestination) return;
    setStartingAlong(true);
    const ride = await base44.entities.Ride.create({
      passenger_email: "along@sentrya.app",
      pickup_location: "Street Hail",
      destination_location: alongDestination,
      city: driver.city || "Lagos",
      status: "in_progress",
      ride_mode: "along",
      driver_email: driver.email,
      driver_name: driver.full_name,
      driver_phone: driver.phone,
      fare_estimate: 0,
      ride_type: driver.vehicle_type || "economy",
      pickup_lat: 0, pickup_lng: 0, dest_lat: 0, dest_lng: 0,
    });
    setActiveRide(ride);
    setDriverStatus("on_trip");
    startGPS(ride.id);
    setStartingAlong(false);
    setTab("requests");
  }

  async function handleTripComplete() {
    stopGPS();
    if (activeRide?.id) {
      await base44.entities.Ride.update(activeRide.id, { status: "completed" }).catch(() => {});
    }
    if (driver) {
      const total = (driver.total_trips || 0) + 1;
      await base44.entities.Driver.update(driver.id, { total_trips: total }).catch(() => {});
      setDriver((d) => ({ ...d, total_trips: total }));
    }
    setActiveRide(null);
    setDriverStatus("available");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Car className="w-14 h-14 text-muted-foreground/40" />
        <h2 className="text-xl font-bold">Driver Access Required</h2>
        <p className="text-muted-foreground text-sm">Your account is not registered as an approved driver.</p>
        <Button onClick={() => window.location.href = "/driver-signup"} className="rounded-xl">
          Apply to Drive
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Driver Dashboard</h1>
            <p className="text-xs text-muted-foreground">{driver.full_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", STATUS_COLORS[driverStatus])}>
              {driverStatus === "available" ? "Available" : driverStatus === "on_trip" ? "On Trip" : "Offline"}
            </span>
            <button
              onClick={handleToggleOnline}
              disabled={driverStatus === "on_trip"}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border transition-all",
                driverStatus !== "offline" ? "bg-safe/10 border-safe/30 text-safe" : "bg-muted border-border text-muted-foreground"
              )}
            >
              {driverStatus !== "offline" ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!activeRide && (
          <div className="flex gap-2">
            {[
              { id: "requests", label: "Requests", icon: Car },
              { id: "along", label: "Along", icon: Hand },
              { id: "leaderboard", label: "Top Drivers", icon: Trophy },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold border transition-all",
                  tab === id ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border"
                )}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Active Trip */}
        {activeRide && (
          <ActiveTripView ride={activeRide} onTripComplete={handleTripComplete} />
        )}

        {/* Requests Tab */}
        {!activeRide && tab === "requests" && (
          <div className="space-y-3">
            {driverStatus === "offline" && (
              <div className="rounded-2xl bg-muted/50 border border-border p-5 text-center">
                <WifiOff className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">You are offline</p>
                <p className="text-xs text-muted-foreground mt-1">Go online to receive ride requests</p>
                <Button onClick={handleToggleOnline} className="mt-3 rounded-xl" size="sm">Go Online</Button>
              </div>
            )}

            {driverStatus === "available" && pendingRides.length === 0 && (
              <div className="rounded-2xl bg-muted/30 border border-border p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Car className="w-6 h-6 text-primary" />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
                <p className="text-sm font-semibold">Waiting for ride requests…</p>
                <p className="text-xs text-muted-foreground mt-1">You'll be notified when passengers book</p>
              </div>
            )}

            {driverStatus === "available" && pendingRides.map((ride) => (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border border-border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full capitalize">
                    {ride.ride_type}
                  </span>
                  <span className="text-sm font-bold text-primary">₦{(ride.fare_estimate || 0).toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-safe shrink-0" />
                    <p className="text-xs truncate">{ride.pickup_location}</p>
                  </div>
                  <div className="w-px h-3 bg-border ml-[6px]" />
                  <div className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-danger shrink-0" />
                    <p className="text-xs truncate">{ride.destination_location}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    onClick={() => handleDecline(ride)}
                    className="flex-1 rounded-xl border-danger/30 text-danger hover:bg-danger/5 gap-1.5"
                    size="sm"
                  >
                    <XCircle className="w-4 h-4" /> Decline
                  </Button>
                  <Button
                    onClick={() => handleAccept(ride)}
                    className="flex-1 rounded-xl bg-safe hover:bg-safe/90 text-white gap-1.5"
                    size="sm"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Leaderboard Tab */}
        {!activeRide && tab === "leaderboard" && (
          <div className="py-4 text-center space-y-3">
            <Trophy className="w-12 h-12 text-caution mx-auto" />
            <p className="font-semibold">Driver Performance Leaderboard</p>
            <p className="text-xs text-muted-foreground">See top-rated drivers across the platform</p>
            <Link to="/drivers-leaderboard">
              <div className="rounded-2xl border border-caution/30 bg-caution/5 p-3 flex items-center gap-3 mt-2">
                <Trophy className="w-5 h-5 text-caution shrink-0" />
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold">View Full Leaderboard</p>
                  <p className="text-xs text-muted-foreground">Ratings, trips & rankings</p>
                </div>
                <span className="text-xs text-caution">Open →</span>
              </div>
            </Link>
          </div>
        )}

        {/* Along Tab */}
        {!activeRide && tab === "along" && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Start an "Along" Trip</p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Picked up a street passenger? Enter their destination to log and track the trip instantly.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Passenger Destination</label>
              <LocationSearch
                placeholder="Where is the passenger going?"
                value={alongDestination}
                onChange={setAlongDestination}
                icon="destination"
              />
            </div>
            <Button
              onClick={handleStartAlong}
              disabled={!alongDestination || startingAlong || driverStatus === "offline"}
              className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
              {startingAlong ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Hand className="w-5 h-5" /> Start Along Trip</>
              )}
            </Button>
            {driverStatus === "offline" && (
              <p className="text-xs text-center text-muted-foreground">Go online first to start a trip</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}