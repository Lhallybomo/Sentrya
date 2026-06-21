import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, X, MessageSquare, Car, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function NegotiationPanel({ ride, onAccepted }) {
  const [offers, setOffers] = useState([]);
  const [counterInputs, setCounterInputs] = useState({});

  useEffect(() => {
    if (!ride?.id) return;
    loadOffers();
    const unsub = base44.entities.RideOffer.subscribe((event) => {
      if (event.data?.ride_id === ride.id) {
        if (event.type === "create") setOffers((prev) => [event.data, ...prev]);
        else if (event.type === "update") setOffers((prev) => prev.map((o) => (o.id === event.id ? event.data : o)));
      }
    });
    return unsub;
  }, [ride?.id]);

  // Simulate a driver offer after 4 seconds for demo
  useEffect(() => {
    if (!ride?.id) return;
    const timer = setTimeout(async () => {
      const demoDrivers = [
        { name: "Emeka Okafor", phone: "08031234567", vehicle: "Toyota Corolla - Silver - LND123AX", price: Math.round(ride.fare_estimate * 0.9) },
        { name: "Bola Adeyemi", phone: "07055678901", vehicle: "Honda Accord - Black - ABJ456BC", price: Math.round(ride.fare_estimate * 1.05) },
      ];
      const d = demoDrivers[Math.floor(Math.random() * demoDrivers.length)];
      await base44.entities.RideOffer.create({
        ride_id: ride.id,
        driver_email: `driver_${Date.now()}@along.app`,
        driver_name: d.name,
        driver_phone: d.phone,
        vehicle_info: d.vehicle,
        offered_price: d.price,
        status: "pending",
        message: "I'm nearby and ready to take you!",
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, [ride?.id]);

  async function loadOffers() {
    const data = await base44.entities.RideOffer.filter({ ride_id: ride.id });
    setOffers(data);
  }

  async function acceptOffer(offer) {
    await base44.entities.RideOffer.update(offer.id, { status: "accepted" });
    await base44.entities.Ride.update(ride.id, { status: "accepted", driver_email: offer.driver_email, fare_estimate: offer.offered_price });
    onAccepted(offer);
  }

  async function rejectOffer(offer) {
    await base44.entities.RideOffer.update(offer.id, { status: "rejected" });
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));
  }

  async function sendCounter(offer) {
    const val = parseFloat(counterInputs[offer.id]);
    if (!val || val < 100) return;
    await base44.entities.RideOffer.update(offer.id, { status: "countered", counter_price: val });
    setCounterInputs((prev) => ({ ...prev, [offer.id]: "" }));
  }

  const pendingOffers = offers.filter((o) => o.status === "pending" || o.status === "countered");

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
        <p className="text-sm font-semibold">Waiting for drivers…</p>
      </div>

      {pendingOffers.length === 0 && (
        <div className="rounded-2xl bg-muted/50 border border-border p-4 text-center text-sm text-muted-foreground">
          Looking for drivers nearby. Offers will appear here…
        </div>
      )}

      <AnimatePresence>
        {pendingOffers.map((offer) => (
          <motion.div
            key={offer.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Car className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{offer.driver_name}</p>
                <p className="text-xs text-muted-foreground truncate">{offer.vehicle_info}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 text-caution fill-caution" />
                  <span className="text-xs text-muted-foreground">4.8 • {offer.driver_phone}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary">₦{offer.offered_price?.toLocaleString()}</p>
                {offer.status === "countered" && offer.counter_price && (
                  <p className="text-xs text-caution">Your offer: ₦{offer.counter_price?.toLocaleString()}</p>
                )}
              </div>
            </div>

            {offer.message && (
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.message}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => acceptOffer(offer)}
                className="flex-1 rounded-xl bg-safe hover:bg-green-600 text-white gap-1"
              >
                <CheckCircle className="w-4 h-4" /> Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectOffer(offer)}
                className="rounded-xl gap-1 text-danger border-danger/30"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Your counter-offer (₦)"
                type="number"
                value={counterInputs[offer.id] || ""}
                onChange={(e) => setCounterInputs((prev) => ({ ...prev, [offer.id]: e.target.value }))}
                className="rounded-xl text-sm h-9"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => sendCounter(offer)}
                className="rounded-xl shrink-0 px-3"
              >
                Counter
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}