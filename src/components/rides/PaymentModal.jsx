import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, Smartphone, Banknote, CheckCircle, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-XXXXXXXXXXXXXXXXXXXX-X"; // Replace with real key

const paymentMethods = [
  { id: "card", label: "Card", description: "Visa / Mastercard", icon: CreditCard },
  { id: "ussd", label: "USSD", description: "Bank transfer via USSD", icon: Smartphone },
  { id: "cash", label: "Cash", description: "Pay driver directly", icon: Banknote },
];

export default function PaymentModal({ open, onClose, ride, offer, passengerEmail }) {
  const [method, setMethod] = useState("card");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  const amount = offer?.offered_price || ride?.fare_estimate || 0;

  async function handlePay() {
    if (method === "cash") {
      // Cash — just mark as paid locally
      setPaid(true);
      setTimeout(() => { onClose(true); }, 1500);
      return;
    }

    setPaying(true);

    // Load Flutterwave inline script dynamically
    if (!window.FlutterwaveCheckout) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.flutterwave.com/v3.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    const txRef = `SENTRYA-${ride?.id || Date.now()}-${Date.now()}`;

    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: txRef,
      amount: amount,
      currency: "NGN",
      payment_options: method === "ussd" ? "ussd" : "card",
      customer: {
        email: passengerEmail || "passenger@sentrya.app",
        name: "Sentrya Passenger",
      },
      customizations: {
        title: "SENTRYA Ride Payment",
        description: `Ride from ${ride?.pickup_location || ""} to ${ride?.destination_location || ""}`,
        logo: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=100&h=100&fit=crop",
      },
      callback: async (response) => {
        setPaying(false);
        if (response.status === "successful" || response.status === "completed") {
          // Update ride with payment info
          if (ride?.id) {
            await base44.entities.Ride.update(ride.id, { status: "accepted" });
          }
          setPaid(true);
          setTimeout(() => { onClose(true); }, 1500);
        } else {
          setPaying(false);
        }
      },
      onclose: () => {
        setPaying(false);
      },
    });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="w-full max-w-sm bg-card rounded-3xl p-5 shadow-2xl border border-border"
          >
            {paid ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-safe/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-safe" />
                </div>
                <h3 className="text-lg font-bold">Payment Confirmed!</h3>
                <p className="text-sm text-muted-foreground mt-1">Your ride is confirmed. Driver is on the way.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">Complete Payment</h3>
                  <button onClick={() => onClose(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Fare summary */}
                <div className="bg-primary/5 rounded-2xl p-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Agreed Fare</p>
                    <p className="text-2xl font-bold text-primary">₦{amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Driver</p>
                    <p className="text-sm font-semibold">{offer?.driver_name || "—"}</p>
                  </div>
                </div>

                {/* Payment method */}
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Payment Method</p>
                <div className="space-y-2 mb-4">
                  {paymentMethods.map(({ id, label, description, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setMethod(id)}
                      className={cn(
                        "w-full rounded-2xl p-3 border-2 flex items-center gap-3 transition-all text-left",
                        method === id ? "border-primary bg-primary/5" : "border-border bg-background"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                        method === id ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                      {method === id && <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full h-12 rounded-xl text-base font-semibold gap-2"
                >
                  {paying ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : method === "cash" ? (
                    "Confirm Cash Payment"
                  ) : (
                    `Pay ₦${amount.toLocaleString()} via Flutterwave`
                  )}
                </Button>
                <p className="text-[10px] text-center text-muted-foreground mt-2">
                  Card payments secured by Flutterwave
                </p>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}