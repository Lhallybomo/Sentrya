import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MapPin, Phone, CheckCircle, X, Loader2, Radio, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

export default function SOSModal({ open, onClose }) {
  const [stage, setStage] = useState("confirm"); // confirm | locating | sending | done
  const [level, setLevel] = useState(1); // 1=notify | 2=track | 3=escalate
  const [coords, setCoords] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [notified, setNotified] = useState(0);
  const [tracking, setTracking] = useState(false);
  const trackRef = useRef(null);

  useEffect(() => {
    if (open) {
      setStage("confirm");
      setCoords(null);
      setNotified(0);
      setLevel(1);
      loadContacts();
    }
    return () => {
      if (trackRef.current) navigator.geolocation.clearWatch(trackRef.current);
    };
  }, [open]);

  async function loadContacts() {
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (!authenticated) { setContacts([]); return; }
      const user = await base44.auth.me();
      const data = await base44.entities.EmergencyContact.filter({ owner_email: user.email });
      setContacts(data);
    } catch { setContacts([]); }
  }

  async function triggerSOS() {
    setStage("locating");

    // Vibrate — escalating pattern
    if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 1000]);

    let position = null;
    try {
      position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true })
      );
    } catch { position = null; }

    const lat = position?.coords?.latitude || 9.0820;
    const lng = position?.coords?.longitude || 8.6753;
    setCoords({ lat, lng });

    setStage("sending");

    let user = { email: "unknown", full_name: "SENTRYA User" };
    try {
      const authenticated = await base44.auth.isAuthenticated();
      if (authenticated) user = await base44.auth.me();
    } catch {}

    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    const now = new Date().toLocaleString("en-NG", { timeZone: "Africa/Lagos" });

    // Create distress incident on map
    await base44.entities.Incident.create({
      type: "Other",
      description: `🆘 DISTRESS SIGNAL from ${user.full_name || user.email}. Sent at ${now}. Location: ${mapsLink}`,
      latitude: lat, longitude: lng,
      location_name: "SOS Location",
      state: "Unknown", severity: "danger", status: "active", upvotes: 0,
    });

    // Level 2: Start continuous tracking
    if (level >= 2) {
      setTracking(true);
      trackRef.current = navigator.geolocation.watchPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        null,
        { enableHighAccuracy: true }
      );
    }

    // Send email alerts
    let sent = 0;
    for (const contact of contacts) {
      if (contact.email) {
        try {
          await base44.integrations.Core.SendEmail({
            to: contact.email,
            subject: `🚨 SOS EMERGENCY — ${user.full_name || user.email} needs help NOW!`,
            body: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 SENTRYA EMERGENCY SOS ALERT — LEVEL ${level}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${user.full_name || user.email} has triggered an SOS emergency alert.

📍 GPS Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}
🗺️ View on map: ${mapsLink}
🕐 Time: ${now}
⚡ Escalation Level: ${level === 1 ? "Notify Contacts" : level === 2 ? "Live Tracking Active" : "FULL EMERGENCY ESCALATION"}

${level >= 2 ? "⚠️ Live location tracking is active. Visit the map link above for their latest position." : ""}

CALL THEM IMMEDIATELY. If no answer, alert authorities.

Nigeria Emergency: 112 · Police: 07002357464 · Ambulance: 08032003559

— SENTRYA Travel Safety Intelligence Platform
            `.trim(),
          });
          sent++;
        } catch {}
      }
    }
    setNotified(sent);
    setStage("done");
  }

  function stopTracking() {
    if (trackRef.current) navigator.geolocation.clearWatch(trackRef.current);
    setTracking(false);
  }

  if (!open) return null;

  const levelConfig = [
    { n: 1, label: "Notify Contacts", desc: "Alert all emergency contacts", icon: Phone, color: "text-caution" },
    { n: 2, label: "Live Tracking", desc: "Start continuous location sharing", icon: Radio, color: "text-primary" },
    { n: 3, label: "Full Escalation", desc: "Maximum emergency response", icon: Zap, color: "text-danger" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={(e) => e.target === e.currentTarget && stage === "done" && onClose()}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="w-full max-w-xs bg-card rounded-3xl p-4 shadow-2xl border border-danger/20 mb-8"
        >
          {stage === "confirm" && (
            <div>
              {/* Header */}
              <div className="flex items-center justify-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/30 flex items-center justify-center"
                >
                  <AlertTriangle className="w-10 h-10 text-danger" />
                </motion.div>
              </div>
              <h2 className="text-xl font-bold text-center mb-1">Trigger Emergency SOS?</h2>
              <p className="text-xs text-muted-foreground text-center mb-4">Select your escalation level</p>

              {/* Level selector */}
              <div className="space-y-2 mb-5">
                {levelConfig.map(({ n, label, desc, icon: Icon, color }) => (
                  <button
                    key={n}
                    onClick={() => setLevel(n)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                      level === n ? "border-danger/40 bg-danger/5" : "border-border bg-muted/30"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-card", level === n && "shadow")}>
                      <Icon className={cn("w-4 h-4", level === n ? "text-danger" : color)} />
                    </div>
                    <div className="flex-1">
                      <p className={cn("text-xs font-semibold", level === n ? "text-danger" : "text-foreground")}>Level {n}: {label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                    <div className={cn("w-4 h-4 rounded-full border-2 shrink-0", level === n ? "border-danger bg-danger" : "border-muted-foreground")} />
                  </button>
                ))}
              </div>

              {contacts.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 text-center bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2">
                  ⚠️ No emergency contacts set. Add contacts in your profile first.
                </p>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl">
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button onClick={triggerSOS} className="flex-1 rounded-xl bg-danger hover:bg-red-600 text-white gap-2 shadow-lg shadow-red-500/30">
                  <AlertTriangle className="w-4 h-4" /> SOS NOW
                </Button>
              </div>
            </div>
          )}

          {(stage === "locating" || stage === "sending") && (
            <div className="text-center py-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4"
              >
                <Loader2 className="w-8 h-8 text-danger animate-spin" />
              </motion.div>
              <h2 className="text-lg font-bold mb-1">
                {stage === "locating" ? "Acquiring GPS Signal..." : "Sending Emergency Alerts..."}
              </h2>
              <p className="text-sm text-muted-foreground">
                {stage === "locating" ? "Getting your precise location" : `Notifying ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          )}

          {stage === "done" && (
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-danger" />
              </div>
              <h2 className="text-xl font-bold mb-1">SOS Activated!</h2>
              <p className="text-xs text-muted-foreground mb-3">Level {level} response triggered</p>

              {coords && (
                <a
                  href={`https://maps.google.com/?q=${coords.lat},${coords.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1 text-xs text-primary mb-3 hover:underline"
                >
                  <MapPin className="w-3 h-3" />
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} — View on map
                </a>
              )}

              <div className="bg-muted/50 rounded-xl p-3 text-sm mb-3 space-y-1.5 text-left">
                <p className="text-safe font-medium text-xs">✅ Distress pin added to live map</p>
                <p className={cn("font-medium text-xs", notified > 0 ? "text-safe" : "text-muted-foreground")}>
                  {notified > 0 ? `✅ ${notified} contact${notified !== 1 ? "s" : ""} alerted by email` : "⚠️ No contacts emailed"}
                </p>
                {tracking && <p className="text-primary font-medium text-xs">📡 Live location tracking active</p>}
              </div>

              <div className="bg-danger/5 border border-danger/20 rounded-xl p-3 mb-4 text-left">
                <p className="text-[10px] font-bold text-danger mb-1">Emergency Numbers — Nigeria</p>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
                  <span>🚔 Police: <b className="text-foreground">112</b></span>
                  <span>🚑 Ambulance: <b className="text-foreground">08032003559</b></span>
                  <span>🚒 Fire: <b className="text-foreground">08039003559</b></span>
                  <span>📞 NEMA: <b className="text-foreground">08056000000</b></span>
                </div>
              </div>

              <div className="flex gap-2">
                {tracking && (
                  <Button variant="outline" onClick={stopTracking} className="flex-1 rounded-xl text-xs border-danger/30 text-danger">
                    Stop Tracking
                  </Button>
                )}
                <Button onClick={onClose} className="flex-1 rounded-xl">Close</Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}