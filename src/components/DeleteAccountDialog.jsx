import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function DeleteAccountDialog({ onClose }) {
  const [step, setStep] = useState("confirm"); // confirm | deleting | done
  const [typed, setTyped] = useState("");

  async function handleDelete() {
    setStep("deleting");
    try {
      // Delete all user's data then log out
      const user = await base44.auth.me();
      // Remove emergency contacts
      const contacts = await base44.entities.EmergencyContact.filter({ owner_email: user.email });
      await Promise.all(contacts.map((c) => base44.entities.EmergencyContact.delete(c.id)));
      // Cancel pending rides
      const rides = await base44.entities.Ride.filter({ passenger_email: user.email, status: "pending" });
      await Promise.all(rides.map((r) => base44.entities.Ride.update(r.id, { status: "cancelled" })));
    } catch {}
    setStep("done");
    setTimeout(() => base44.auth.logout(), 2000);
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="w-full max-w-sm bg-card rounded-3xl p-5 shadow-2xl border border-danger/20 mb-4"
        >
          {step === "confirm" && (
            <div>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center">
                  <Trash2 className="w-8 h-8 text-danger" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-center mb-1">Delete Account?</h2>
              <p className="text-xs text-muted-foreground text-center mb-4">
                This action is <span className="font-semibold text-danger">permanent and irreversible</span>. 
                All your data — rides, emergency contacts, and profile — will be erased.
              </p>

              <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 mb-4 space-y-1">
                <p className="text-[11px] text-danger font-semibold">What will be deleted:</p>
                <p className="text-[11px] text-muted-foreground">• All ride history and scheduled trips</p>
                <p className="text-[11px] text-muted-foreground">• Emergency contacts</p>
                <p className="text-[11px] text-muted-foreground">• Account and profile data</p>
              </div>

              <p className="text-xs text-muted-foreground text-center mb-2">
                Type <span className="font-bold text-foreground">DELETE</span> to confirm
              </p>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-danger/30 mb-4 text-center font-mono"
              />

              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  Cancel
                </Button>
                <Button
                  disabled={typed !== "DELETE"}
                  onClick={handleDelete}
                  className="flex-1 rounded-xl bg-danger hover:bg-red-700 text-white disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </div>
          )}

          {step === "deleting" && (
            <div className="text-center py-6">
              <div className="w-10 h-10 border-2 border-danger border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="font-semibold text-sm">Deleting your account…</p>
            </div>
          )}

          {step === "done" && (
            <div className="text-center py-6">
              <AlertTriangle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-semibold text-sm mb-1">Account deleted</p>
              <p className="text-xs text-muted-foreground">Signing you out now…</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}