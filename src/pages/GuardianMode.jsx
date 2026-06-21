import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Shield, Clock, MapPin, CheckCircle2, X, Bell, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import moment from "moment";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

export default function GuardianMode() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTimers, setActiveTimers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [destination, setDestination] = useState("");
  const [durationMins, setDurationMins] = useState(45);
  const [customDuration, setCustomDuration] = useState("");
  const [starting, setStarting] = useState(false);
  const [contacts, setContacts] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    init();
    return () => clearInterval(timerRef.current);
  }, []);

  async function init() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [timers, ctcs] = await Promise.all([
        base44.entities.GuardianTimer.filter({ owner_email: u.email, status: "active" }, "-created_date", 10),
        base44.entities.EmergencyContact.filter({ owner_email: u.email }),
      ]);
      setActiveTimers(timers);
      setContacts(ctcs);
    } catch {}

    // Check timers every minute
    timerRef.current = setInterval(checkTimers, 60000);
  }

  async function checkTimers() {
    if (!user) return;
    const timers = await base44.entities.GuardianTimer.filter({ owner_email: user?.email, status: "active" });
    const now = new Date();
    for (const t of timers) {
      const arrival = new Date(t.expected_arrival);
      const diffMins = (arrival - now) / 60000;

      if (diffMins <= -5 && !t.alert_sent) {
        // Missed arrival — send alerts
        await sendMissedAlert(t);
        await base44.entities.GuardianTimer.update(t.id, { status: "missed", alert_sent: true });
      } else if (diffMins <= 5 && diffMins > 0 && !t.reminder_sent) {
        // 5-min reminder
        await base44.entities.GuardianTimer.update(t.id, { reminder_sent: true });
      }
    }
    const updated = await base44.entities.GuardianTimer.filter({ owner_email: user?.email, status: "active" }, "-created_date", 10);
    setActiveTimers(updated);
  }

  async function sendMissedAlert(timer) {
    const ctcs = await base44.entities.EmergencyContact.filter({ owner_email: timer.owner_email });
    const mapsLink = timer.last_location_lat
      ? `https://maps.google.com/?q=${timer.last_location_lat},${timer.last_location_lng}`
      : "Location unknown";

    for (const c of ctcs) {
      if (c.email) {
        await base44.integrations.Core.SendEmail({
          to: c.email,
          subject: `⚠️ SENTRYA: ${timer.owner_email} missed their expected arrival`,
          body: `Guardian Mode Alert\n\n${timer.owner_email} was expected to arrive at "${timer.destination}" by ${moment(timer.expected_arrival).format("h:mm A")} but has not checked in.\n\nLast known location: ${mapsLink}\n\nPlease try to contact them immediately.\n\nNigeria Emergency: 112\n— SENTRYA Safety Platform`,
        }).catch(() => {});
      }
    }
  }

  async function startTimer() {
    if (!destination || !user) return;
    setStarting(true);
    const mins = customDuration ? parseInt(customDuration) : durationMins;
    const expectedArrival = new Date(Date.now() + mins * 60000).toISOString();

    // Get current location
    let lat = null, lng = null;
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {}

    const timer = await base44.entities.GuardianTimer.create({
      owner_email: user.email,
      destination,
      duration_minutes: mins,
      expected_arrival: expectedArrival,
      status: "active",
      last_location_lat: lat,
      last_location_lng: lng,
      reminder_sent: false,
      alert_sent: false,
    });

    // Notify contacts that trip started
    for (const c of contacts) {
      if (c.email) {
        base44.integrations.Core.SendEmail({
          to: c.email,
          subject: `📍 SENTRYA: ${user.full_name || user.email} started a monitored trip`,
          body: `Guardian Mode Active\n\n${user.full_name || user.email} has started a trip to "${destination}".\nExpected arrival: ${moment(expectedArrival).format("ddd, MMM D [at] h:mm A")}\n\nYou will be alerted if they don't check in on time.\n\n— SENTRYA Safety Platform`,
        }).catch(() => {});
      }
    }

    setActiveTimers((prev) => [timer, ...prev]);
    setShowForm(false);
    setDestination("");
    setCustomDuration("");
    setStarting(false);
  }

  async function markArrived(timer) {
    await base44.entities.GuardianTimer.update(timer.id, { status: "arrived" });
    setActiveTimers((prev) => prev.filter((t) => t.id !== timer.id));

    // Notify contacts
    for (const c of contacts) {
      if (c.email) {
        base44.integrations.Core.SendEmail({
          to: c.email,
          subject: `✅ SENTRYA: ${user?.full_name || user?.email} arrived safely`,
          body: `${user?.full_name || user?.email} has arrived safely at "${timer.destination}".\n\n— SENTRYA Safety Platform`,
        }).catch(() => {});
      }
    }
  }

  async function cancelTimer(timer) {
    await base44.entities.GuardianTimer.update(timer.id, { status: "cancelled" });
    setActiveTimers((prev) => prev.filter((t) => t.id !== timer.id));
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Shield className="w-14 h-14 text-muted-foreground/40" />
        <h2 className="text-xl font-bold">Sign in to use Guardian Mode</h2>
        <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Guardian Mode</h1>
          <p className="text-xs text-muted-foreground">Smart safety timer</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)} className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> New Timer
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* How it works */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <p className="text-xs font-semibold text-primary mb-2">How Guardian Mode Works</p>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>1. Set your destination and expected arrival time</p>
            <p>2. Contacts are notified you're on your way</p>
            <p>3. If you miss arrival, contacts are auto-alerted with your last location</p>
            <p>4. Mark "I Arrived" to close the timer safely</p>
          </div>
        </div>

        {contacts.length === 0 && (
          <div className="rounded-2xl bg-caution/10 border border-caution/30 p-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-caution shrink-0" />
            <p className="text-xs text-caution">No emergency contacts set. <span className="font-semibold underline cursor-pointer" onClick={() => navigate("/emergency-contacts")}>Add contacts</span> to enable alerts.</p>
          </div>
        )}

        {/* Active timers */}
        {activeTimers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Active Timers ({activeTimers.length})</p>
            {activeTimers.map((t) => {
              const arrival = new Date(t.expected_arrival);
              const now = new Date();
              const diffMins = Math.round((arrival - now) / 60000);
              const isOverdue = diffMins < 0;
              return (
                <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-2xl border p-4 space-y-3", isOverdue ? "border-danger/40 bg-danger/5" : "border-safe/30 bg-safe/5")}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", isOverdue ? "bg-danger" : "bg-safe")} />
                      <span className="text-sm font-semibold">{t.destination}</span>
                    </div>
                    <button onClick={() => cancelTimer(t)} className="text-muted-foreground hover:text-danger">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />
                      Expected: {moment(t.expected_arrival).format("h:mm A")}
                    </span>
                    <span className={cn("font-semibold", isOverdue ? "text-danger" : "text-safe")}>
                      {isOverdue ? `${Math.abs(diffMins)}m overdue` : `${diffMins}m remaining`}
                    </span>
                  </div>
                  <Button onClick={() => markArrived(t)} size="sm"
                    className="w-full rounded-xl bg-safe hover:bg-safe/90 text-white gap-2">
                    <CheckCircle2 className="w-4 h-4" /> I Arrived Safely
                  </Button>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTimers.length === 0 && !showForm && (
          <div className="text-center py-16">
            <Shield className="w-14 h-14 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No active timers</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Start a timer before your next trip</p>
            <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Start Guardian Timer
            </Button>
          </div>
        )}

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">New Guardian Timer</p>
                <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Where are you going?</label>
                <Input value={destination} onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Ikeja, Lagos" className="rounded-xl" />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Expected travel time</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {DURATION_PRESETS.map((d) => (
                    <button key={d} onClick={() => { setDurationMins(d); setCustomDuration(""); }}
                      className={cn("py-2 rounded-xl text-xs font-semibold border transition-all",
                        durationMins === d && !customDuration ? "bg-primary text-white border-primary" : "border-border text-muted-foreground bg-background"
                      )}>
                      {d < 60 ? `${d}m` : `${d / 60}h`}
                    </button>
                  ))}
                </div>
                <Input value={customDuration} onChange={(e) => { setCustomDuration(e.target.value); setDurationMins(0); }}
                  placeholder="Or enter custom minutes..." type="number" className="rounded-xl text-sm" />
              </div>

              <Button onClick={startTimer} disabled={!destination || starting || (!durationMins && !customDuration)}
                className="w-full h-11 rounded-xl font-semibold gap-2">
                {starting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
                  <><Shield className="w-4 h-4" /> Start Guardian Timer</>}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}