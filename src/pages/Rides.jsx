import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Car, Hand, MapPin, Navigation, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import LocationSearch from "@/components/rides/LocationSearch";
import DispatchPanel from "@/components/rides/DispatchPanel";
import AlongMode from "@/components/rides/AlongMode";
import ActiveTripView from "@/components/rides/ActiveTripView";
import PaymentModal from "@/components/rides/PaymentModal";

const CITIES = ["Lagos", "Abuja", "Port Harcourt"];
const RIDE_TYPES = [
  { id: "economy", label: "Economy", desc: "Budget-friendly", multiplier: 1 },
  { id: "comfort", label: "Comfort", desc: "Spacious & comfortable", multiplier: 1.4 },
  { id: "premium", label: "Premium", desc: "Luxury vehicles", multiplier: 2 },
];

function estimateFare(type) {
  const base = Math.floor(Math.random() * 800 + 1200);
  const m = RIDE_TYPES.find((r) => r.id === type)?.multiplier || 1;
  return Math.round(base * m);
}

export default function Rides() {
  const [mode, setMode] = useState("app_booking"); // app_booking | along
  const [city, setCity] = useState("Lagos");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rideType, setRideType] = useState("economy");
  const [booking, setBooking] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | dispatching | active
  const [showPayment, setShowPayment] = useState(false);
  const [userEmail, setUserEmail] = useState("guest@sentrya.app");

  useEffect(() => {
    base44.auth.me().then((u) => setUserEmail(u.email)).catch(() => {});
    // Pre-fill from rebook link
    const params = new URLSearchParams(window.location.search);
    const p = params.get("pickup");
    const d = params.get("dest");
    if (p) setPickup(decodeURIComponent(p));
    if (d) setDestination(decodeURIComponent(d));
  }, []);

  async function handleBookRide() {
    if (!pickup || !destination) return;
    setBooking(true);
    const fare = estimateFare(rideType);
    const ride = await base44.entities.Ride.create({
      passenger_email: userEmail,
      pickup_location: pickup,
      destination_location: destination,
      city,
      status: "dispatching",
      ride_mode: "app_booking",
      fare_estimate: fare,
      ride_type: rideType,
      pickup_lat: 0, pickup_lng: 0, dest_lat: 0, dest_lng: 0,
    });
    setActiveRide(ride);
    setPhase("dispatching");
    setBooking(false);
  }

  function handleRideAccepted(ride) {
    setActiveRide(ride);
    setShowPayment(true);
  }

  function handlePaymentClose(paid) {
    setShowPayment(false);
    if (paid) {
      setPhase("active");
    }
  }

  function handleTripComplete() {
    setPhase("idle");
    setActiveRide(null);
    setPickup("");
    setDestination("");
  }

  function handleAlongStarted(ride) {
    setActiveRide(ride);
    setPhase("active");
  }

  function handleCancel() {
    if (activeRide?.id) {
      base44.entities.Ride.update(activeRide.id, { status: "cancelled" }).catch(() => {});
    }
    setPhase("idle");
    setActiveRide(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 safe-area-top">
        <h1 className="text-xl font-bold mb-3">Rides</h1>

        {phase === "idle" && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("app_booking")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all",
                mode === "app_booking"
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              <Car className="w-4 h-4" /> App Booking
            </button>
            <button
              onClick={() => setMode("along")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold border transition-all",
                mode === "along"
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              <Hand className="w-4 h-4" /> Along
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* DISPATCHING PHASE */}
          {phase === "dispatching" && activeRide && (
            <motion.div key="dispatching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <DispatchPanel
                ride={activeRide}
                onRideAccepted={handleRideAccepted}
                onCancel={handleCancel}
              />
              <PaymentModal
                open={showPayment}
                onClose={handlePaymentClose}
                ride={activeRide}
                offer={null}
                passengerEmail={userEmail}
              />
            </motion.div>
          )}

          {/* ACTIVE TRIP PHASE */}
          {phase === "active" && activeRide && (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ActiveTripView ride={activeRide} onTripComplete={handleTripComplete} />
            </motion.div>
          )}

          {/* IDLE PHASE */}
          {phase === "idle" && (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
              {mode === "app_booking" ? (
                <>
                  {/* City selector */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">City</label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Locations */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Pickup</label>
                      <LocationSearch
                        placeholder="Enter pickup location"
                        value={pickup}
                        onChange={setPickup}
                        icon="pickup"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Destination</label>
                      <LocationSearch
                        placeholder="Where are you going?"
                        value={destination}
                        onChange={setDestination}
                        icon="destination"
                      />
                    </div>
                  </div>

                  {/* Ride type */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ride Type</label>
                    <div className="space-y-2">
                      {RIDE_TYPES.map((rt) => (
                        <button
                          key={rt.id}
                          onClick={() => setRideType(rt.id)}
                          className={cn(
                            "w-full rounded-2xl p-3 border-2 flex items-center gap-3 transition-all text-left",
                            rideType === rt.id ? "border-primary bg-primary/5" : "border-border bg-background"
                          )}
                        >
                          <Car className={cn("w-5 h-5 shrink-0", rideType === rt.id ? "text-primary" : "text-muted-foreground")} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{rt.label}</p>
                            <p className="text-xs text-muted-foreground">{rt.desc}</p>
                          </div>
                          {rideType === rt.id && (
                            <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleBookRide}
                    disabled={!pickup || !destination || booking}
                    className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                  >
                    {booking ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <><Car className="w-5 h-5" /> Book Ride</>
                    )}
                  </Button>
                </>
              ) : (
                <AlongMode city={city} onTripStarted={handleAlongStarted} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}