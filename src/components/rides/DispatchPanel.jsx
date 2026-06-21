import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Car, X, Clock, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const REASSIGN_DELAY = 8000; // 8 seconds before auto-reassign

export default function DispatchPanel({ ride, onRideAccepted, onCancel }) {
  const [liveRide, setLiveRide] = useState(ride);
  const [dispatchStatus, setDispatchStatus] = useState("searching"); // searching | driver_found | accepted
  const [countdown, setCountdown] = useState(null);
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    if (!ride?.id) return;

    // Subscribe to ride updates (driver accept/decline reflected here)
    const unsub = base44.entities.Ride.subscribe((event) => {
      if (event.id === ride.id) {
        const updated = event.data;
        setLiveRide(updated);

        if (updated.status === "accepted" || updated.status === "in_progress") {
          setDispatchStatus("accepted");
          setDriverInfo({
            name: updated.driver_name,
            phone: updated.driver_phone,
            vehicle: updated.vehicle_info,
          });
          onRideAccepted?.(updated);
        }
      }
    });

    // Simulate dispatch: after 6s, show a "driver found" pending state
    const findTimer = setTimeout(() => {
      setDispatchStatus("driver_found");
      setCountdown(REASSIGN_DELAY / 1000);
    }, 6000);

    return () => { unsub(); clearTimeout(findTimer); };
  }, [ride?.id]);

  // Countdown timer when driver found but not yet responded
  useEffect(() => {
    if (dispatchStatus !== "driver_found" || countdown === null) return;
    if (countdown <= 0) {
      // Auto reassign — go back to searching
      setDispatchStatus("searching");
      setCountdown(null);
      setTimeout(() => {
        setDispatchStatus("driver_found");
        setCountdown(REASSIGN_DELAY / 1000);
      }, 5000);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [dispatchStatus, countdown]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Route summary */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-safe shrink-0" />
          <p className="text-xs truncate">{ride.pickup_location}</p>
        </div>
        <div className="w-px h-3 bg-border ml-[6px]" />
        <div className="flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-danger shrink-0" />
          <p className="text-xs truncate">{ride.destination_location}</p>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/50 mt-2">
          <span className="text-xs text-muted-foreground">Fare estimate</span>
          <span className="text-sm font-bold text-primary">₦{(ride.fare_estimate || 0).toLocaleString()}</span>
        </div>
      </div>

      {/* Dispatch status */}
      <AnimatePresence mode="wait">
        {dispatchStatus === "searching" && (
          <motion.div key="searching"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center"
          >
            <div className="flex items-center justify-center gap-3 mb-3">
              <Car className="w-6 h-6 text-primary" />
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-primary animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
            <p className="font-semibold text-sm">Finding drivers nearby…</p>
            <p className="text-xs text-muted-foreground mt-1">Your request has been dispatched to available drivers</p>
          </motion.div>
        )}

        {dispatchStatus === "driver_found" && (
          <motion.div key="driver_found"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-caution/10 border border-caution/30 p-5 text-center"
          >
            <div className="w-3 h-3 rounded-full bg-caution animate-pulse mx-auto mb-3" />
            <p className="font-semibold text-sm">Driver notified — awaiting response</p>
            <p className="text-xs text-muted-foreground mt-1">
              {countdown !== null
                ? `Auto-reassigning in ${countdown}s if no response…`
                : "Looking for next available driver…"}
            </p>
            {countdown !== null && (
              <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-caution rounded-full"
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: REASSIGN_DELAY / 1000, ease: "linear" }}
                />
              </div>
            )}
          </motion.div>
        )}

        {dispatchStatus === "accepted" && driverInfo && (
          <motion.div key="accepted"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl bg-safe/10 border border-safe/30 p-5 text-center"
          >
            <div className="w-3 h-3 rounded-full bg-safe mx-auto mb-3" />
            <p className="font-bold text-safe">Driver Accepted!</p>
            <p className="font-semibold mt-1">{driverInfo.name}</p>
            <p className="text-xs text-muted-foreground">{driverInfo.vehicle}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel */}
      {dispatchStatus !== "accepted" && (
        <Button variant="outline" onClick={onCancel} className="w-full rounded-xl gap-2 text-danger border-danger/30">
          <X className="w-4 h-4" /> Cancel Request
        </Button>
      )}
    </motion.div>
  );
}