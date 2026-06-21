import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, CheckCircle, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const CITIES = ["Lagos", "Abuja", "Port Harcourt", "Kano", "Ibadan", "Enugu", "Kaduna", "Other"];

export default function DriverSignup() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", city: "",
    vehicle_make: "", vehicle_model: "", vehicle_color: "", plate_number: "", vehicle_type: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(field, val) {
    setForm((prev) => ({ ...prev, [field]: val }));
  }

  async function handleSubmit() {
    const required = ["full_name", "email", "phone", "city", "vehicle_make", "vehicle_model", "plate_number", "vehicle_type"];
    if (required.some((f) => !form[f])) return;
    setSubmitting(true);
    await base44.entities.Driver.create({ ...form, status: "pending", rating: 5, total_trips: 0, is_online: false });
    setSubmitting(false);
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3">
        <Link to="/rides" className="p-1 rounded-lg hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold">Become a Driver</h1>
          <p className="text-xs text-muted-foreground">Join SENTRYA's verified driver network</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-safe/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-safe" />
              </div>
              <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Your driver application is under review. We'll notify you via email within 24–48 hours.
              </p>
              <Link to="/rides">
                <Button className="mt-8 rounded-xl px-8">Back to Rides</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="form" className="space-y-4">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <Car className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Drive on your terms</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Set your own prices, negotiate directly with passengers, and earn more on SENTRYA.
                  </p>
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Personal Information</h2>
                <Input placeholder="Full Name *" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className="rounded-xl" />
                <Input placeholder="Email Address *" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className="rounded-xl" />
                <Input placeholder="Phone Number *" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="rounded-xl" />
                <Select value={form.city} onValueChange={(v) => update("city", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Operating City *" /></SelectTrigger>
                  <SelectContent>
                    {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Vehicle Information</h2>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Make (e.g Toyota) *" value={form.vehicle_make} onChange={(e) => update("vehicle_make", e.target.value)} className="rounded-xl" />
                  <Input placeholder="Model (e.g Corolla) *" value={form.vehicle_model} onChange={(e) => update("vehicle_model", e.target.value)} className="rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Color (e.g Silver)" value={form.vehicle_color} onChange={(e) => update("vehicle_color", e.target.value)} className="rounded-xl" />
                  <Input placeholder="Plate Number *" value={form.plate_number} onChange={(e) => update("plate_number", e.target.value)} className="rounded-xl" />
                </div>
                <Select value={form.vehicle_type} onValueChange={(v) => update("vehicle_type", v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Vehicle Category *" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy (Sedan/Hatchback)</SelectItem>
                    <SelectItem value="comfort">Comfort (SUV/Crossover)</SelectItem>
                    <SelectItem value="premium">Premium (Luxury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl text-base font-semibold gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Car className="w-5 h-5" /> Submit Application</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}