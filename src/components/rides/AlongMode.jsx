import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Hand, MapPin, Navigation, Car, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import LocationSearch from "./LocationSearch";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AlongMode({ city, onTripStarted }) {
  const [destination, setDestination] = useState("");
  const [pickup, setPickup] = useState("");
  const [starting, setStarting] = useState(false);

  async function handleStartAlong() {
    if (!destination) return;
    setStarting(true);

    let userEmail = "guest@sentrya.app";
    try { const u = await base44.auth.me(); userEmail = u.email; } catch {}

    const ride = await base44.entities.Ride.create({
      passenger_email: userEmail,
      pickup_location: pickup || "Street Hail",
      destination_location: destination,
      city: city || "Lagos",
      status: "in_progress",
      ride_mode: "along",
      fare_estimate: 0,
      ride_type: "economy",
      pickup_lat: 0, pickup_lng: 0, dest_lat: 0, dest_lng: 0,
    });

    setStarting(false);
    onTripStarted?.(ride);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Info banner */}
      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-caution shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Street Hail — "Along" Mode</p>
          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
            You've already stopped a taxi physically. Just enter your destination to start tracking your trip. No driver request is sent — trip begins immediately.
          </p>
        </div>
      </div>

      {/* Hand icon */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Hand className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm font-semibold">Hailed a taxi?</p>
        <p className="text-xs text-muted-foreground text-center">Enter your destination to log and track the trip</p>
      </div>

      {/* Pickup (optional) */}
      <div>
        <label className="text-sm font-medium mb-2 block">Your Current Location <span className="text-muted-foreground font-normal">(optional)</span></label>
        <LocationSearch
          placeholder="Where are you? (optional)"
          value={pickup}
          onChange={(val) => setPickup(val)}
          icon="pickup"
        />
      </div>

      {/* Destination */}
      <div>
        <label className="text-sm font-medium mb-2 block">Destination <span className="text-danger">*</span></label>
        <LocationSearch
          placeholder="Where are you going?"
          value={destination}
          onChange={(val) => setDestination(val)}
          icon="destination"
        />
      </div>

      {/* Safety note */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3 flex items-start gap-2.5">
        <Car className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Once started, your trip will be logged and your emergency contacts will be notified. The SOS button will remain active throughout your journey.
        </p>
      </div>

      <Button
        onClick={handleStartAlong}
        disabled={!destination || starting}
        className="w-full h-12 rounded-xl text-base font-semibold gap-2 bg-amber-500 hover:bg-amber-600 text-white"
      >
        {starting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <><Hand className="w-5 h-5" /> Start Along Trip</>
        )}
      </Button>
    </motion.div>
  );
}