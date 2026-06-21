import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TripReviewModal({ ride, onClose }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!rating) return;
    setSubmitting(true);
    let userEmail = ride.passenger_email;
    try { const u = await base44.auth.me(); userEmail = u.email; } catch {}

    await base44.entities.TripReview.create({
      ride_id: ride.id,
      passenger_email: userEmail,
      driver_email: ride.driver_email || "",
      rating,
      comment,
    });

    // Update driver average rating
    if (ride.driver_email) {
      const reviews = await base44.entities.TripReview.filter({ driver_email: ride.driver_email });
      const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
      const drivers = await base44.entities.Driver.filter({ email: ride.driver_email });
      if (drivers.length > 0) {
        await base44.entities.Driver.update(drivers[0].id, { rating: Math.round(avg * 10) / 10 });
      }
    }

    setDone(true);
    setTimeout(() => onClose(true), 1500);
  }

  const LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        className="w-full max-w-sm bg-card rounded-3xl p-5 shadow-2xl border border-border">
        {done ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-safe/10 flex items-center justify-center mx-auto mb-3">
              <Star className="w-8 h-8 text-caution fill-caution" />
            </div>
            <h3 className="text-lg font-bold">Thanks for your review!</h3>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold">Rate your trip</h3>
              <button onClick={() => onClose(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>

            <div className="bg-muted/40 rounded-2xl p-3 mb-4 space-y-1">
              <p className="text-xs font-medium">{ride.driver_name || "Your Driver"}</p>
              <p className="text-[10px] text-muted-foreground">{ride.pickup_location} → {ride.destination_location}</p>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              {[1,2,3,4,5].map((s) => (
                <button key={s} onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95">
                  <Star className={cn("w-9 h-9 transition-colors",
                    s <= (hover || rating) ? "fill-caution text-caution" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
            {(hover || rating) > 0 && (
              <p className="text-center text-xs font-semibold text-caution mb-4">{LABELS[hover || rating]}</p>
            )}

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)..."
              rows={3}
              className="w-full text-sm rounded-xl border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring mb-4"
            />

            <Button onClick={submit} disabled={!rating || submitting}
              className="w-full h-11 rounded-xl font-semibold gap-2">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                <><Send className="w-4 h-4" /> Submit Review</>}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}