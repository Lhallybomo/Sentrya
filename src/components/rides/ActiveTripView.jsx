import { useEffect, useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { MapPin, Navigation, Phone, Shield, Clock, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import SOSButton from "@/components/sos/SOSButton";
import TripReviewModal from "@/components/rides/TripReviewModal";

function DriverDot({ lat, lng }) {
  // Small animated driver marker shown while tracking
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
        <div className="absolute inset-0 w-4 h-4 rounded-full bg-primary/30 animate-ping" />
      </div>
    </div>
  );
}

export default function ActiveTripView({ ride, onTripComplete }) {
  const [liveRide, setLiveRide] = useState(ride);
  const [elapsed, setElapsed] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const intervalRef = useRef(null);
  const notifiedStartRef = useRef(false);

  useEffect(() => {
    if (!ride?.id) return;

    // Send start notification to emergency contacts
    if (!notifiedStartRef.current) {
      notifiedStartRef.current = true;
      sendRideNotification(ride, "started");
    }

    const unsub = base44.entities.Ride.subscribe((event) => {
      if (event.id === ride.id) {
        setLiveRide(event.data);
        if (event.data?.status === "completed") {
          clearInterval(intervalRef.current);
          sendRideNotification(event.data, "completed");
          setShowReview(true);
        }
      }
    });
    return unsub;
  }, [ride?.id]);

  async function sendRideNotification(rideData, eventType) {
    try {
      const u = await base44.auth.me();
      const contacts = await base44.entities.EmergencyContact.filter({ owner_email: u.email });
      const subject = eventType === "started"
        ? `🚗 SENTRYA: ${u.full_name || u.email} started a ride`
        : `✅ SENTRYA: ${u.full_name || u.email} completed their ride`;
      const body = eventType === "started"
        ? `Your contact ${u.full_name || u.email} has started a ride.\n\nPickup: ${rideData.pickup_location}\nDestination: ${rideData.destination_location}\nDriver: ${rideData.driver_name || "Unknown"} — ${rideData.vehicle_info || ""}\nFare: ₦${(rideData.fare_estimate || 0).toLocaleString()}\n\n— SENTRYA Safety Platform`
        : `${u.full_name || u.email} has completed their ride and arrived safely.\n\nRoute: ${rideData.pickup_location} → ${rideData.destination_location}\n\n— SENTRYA Safety Platform`;
      for (const c of contacts) {
        if (c.email) {
          base44.integrations.Core.SendEmail({ to: c.email, subject, body }).catch(() => {});
        }
      }
    } catch {}
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const isCompleted = liveRide?.status === "completed";
  const driverName = liveRide?.driver_name || "Your Driver";
  const driverPhone = liveRide?.driver_phone;
  const vehicleInfo = liveRide?.vehicle_info;
  const hasDriverLocation = liveRide?.driver_lat && liveRide?.driver_lng;

  if (isCompleted) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12 px-6"
        >
          <div className="w-20 h-20 rounded-full bg-safe/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-safe" />
          </div>
          <h2 className="text-xl font-bold mb-1">Trip Completed!</h2>
          <p className="text-muted-foreground text-sm mb-2">You've arrived safely at your destination.</p>
          <p className="text-xs text-muted-foreground mb-6">Duration: {formatTime(elapsed)}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setShowReview(true)} className="rounded-xl gap-2">
              <Star className="w-4 h-4" /> Rate Trip
            </Button>
            <Button onClick={() => onTripComplete?.()} className="rounded-xl">Done</Button>
          </div>
        </motion.div>
        {showReview && liveRide && (
          <TripReviewModal ride={liveRide} onClose={() => { setShowReview(false); onTripComplete?.(); }} />
        )}
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-4">
      {/* Status Banner */}
      <div className={cn(
        "rounded-2xl p-4 flex items-center gap-3",
        liveRide?.status === "in_progress" ? "bg-safe/10 border border-safe/30" : "bg-primary/10 border border-primary/30"
      )}>
        <div className="w-3 h-3 rounded-full bg-safe animate-pulse shrink-0" />
        <div>
          <p className="font-semibold text-sm">
            {liveRide?.status === "in_progress" ? "Trip In Progress" : "Driver Accepted — En Route to You"}
          </p>
          <p className="text-xs text-muted-foreground">Trip timer: {formatTime(elapsed)}</p>
        </div>
        <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {formatTime(elapsed)}
        </div>
      </div>

      {/* Driver card */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
            {driverName[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold">{driverName}</p>
            <p className="text-xs text-muted-foreground">{vehicleInfo}</p>
          </div>
          {driverPhone && (
            <a href={`tel:${driverPhone}`}
              className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center text-safe">
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Route summary */}
        <div className="space-y-2 bg-muted/40 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-safe shrink-0" />
            <p className="text-xs truncate">{liveRide?.pickup_location}</p>
          </div>
          <div className="w-px h-3 bg-border ml-[7px]" />
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-danger shrink-0" />
            <p className="text-xs truncate">{liveRide?.destination_location}</p>
          </div>
        </div>
      </div>

      {/* Live tracking indicator */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <p className="text-xs font-semibold">Live Tracking Active</p>
        </div>
        {hasDriverLocation ? (
          <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3">
            <DriverDot lat={liveRide.driver_lat} lng={liveRide.driver_lng} />
            <div>
              <p className="text-xs font-medium">Driver location updating</p>
              <p className="text-[10px] text-muted-foreground">
                {liveRide.driver_lat?.toFixed(4)}, {liveRide.driver_lng?.toFixed(4)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Waiting for driver GPS signal…</p>
        )}
      </div>

      {/* Safety */}
      <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">Safety Active</p>
          <p className="text-xs text-muted-foreground">Emergency contacts notified. SOS available.</p>
        </div>
        <SOSButton />
      </div>

      {/* Fare */}
      {liveRide?.fare_estimate && (
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">₦{liveRide.fare_estimate.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Agreed fare</p>
        </div>
      )}
    </motion.div>
  );
}