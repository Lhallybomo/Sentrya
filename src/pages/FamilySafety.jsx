import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, MapPin, Clock, CheckCircle2, AlertTriangle, Phone, Plus, X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import moment from "moment";

export default function FamilySafety() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [timers, setTimers] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ contact_name: "", phone: "", email: "", relationship: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const [ctcs, tms, rds] = await Promise.all([
        base44.entities.EmergencyContact.filter({ owner_email: u.email }),
        base44.entities.GuardianTimer.filter({ owner_email: u.email, status: "active" }, "-created_date", 5),
        base44.entities.Ride.filter({ passenger_email: u.email }, "-created_date", 5),
      ]);
      setContacts(ctcs);
      setTimers(tms);
      setRides(rds.filter(r => ["accepted", "in_progress"].includes(r.status)));
    } catch {}
    setLoading(false);
  }

  async function addContact() {
    if (!newContact.contact_name || !newContact.phone || !user) return;
    setSaving(true);
    await base44.entities.EmergencyContact.create({ ...newContact, owner_email: user.email });
    await init();
    setNewContact({ contact_name: "", phone: "", email: "", relationship: "" });
    setShowAddContact(false);
    setSaving(false);
  }

  async function removeContact(id) {
    await base44.entities.EmergencyContact.delete(id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <Users className="w-14 h-14 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Sign in to access Family Safety</p>
        <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl">Sign In</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Family Safety</h1>
          <p className="text-xs text-muted-foreground">Monitor & protect your family</p>
        </div>
        <Button size="sm" onClick={() => setShowAddContact(true)} className="rounded-xl gap-1.5">
          <Plus className="w-4 h-4" /> Add Guardian
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="p-4 space-y-5">
          {/* Stats overview */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Guardians", value: contacts.length, icon: Users, color: "text-primary" },
              { label: "Active Timers", value: timers.length, icon: Clock, color: "text-caution" },
              { label: "Active Rides", value: rides.length, icon: Shield, color: "text-safe" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-card rounded-2xl border border-border p-3 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
                <p className="text-lg font-bold">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {/* Active rides monitoring */}
          {rides.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                Active Trips
              </p>
              {rides.map(ride => (
                <div key={ride.id} className="bg-safe/5 border border-safe/20 rounded-2xl p-4 mb-2">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-safe shrink-0" />
                    <span className="text-sm font-semibold capitalize">{ride.status.replace("_", " ")}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{moment(ride.created_date).fromNow()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ride.pickup_location} → {ride.destination_location}</p>
                  {ride.driver_name && <p className="text-xs mt-1">Driver: <span className="font-medium">{ride.driver_name}</span></p>}
                </div>
              ))}
            </div>
          )}

          {/* Active Guardian Timers */}
          {timers.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-caution" />
                Active Guardian Timers
              </p>
              {timers.map(t => {
                const arrival = new Date(t.expected_arrival);
                const diff = Math.round((arrival - Date.now()) / 60000);
                const overdue = diff < 0;
                return (
                  <div key={t.id} className={cn("rounded-2xl border p-4 mb-2", overdue ? "border-danger/30 bg-danger/5" : "border-caution/30 bg-caution/5")}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{t.destination}</p>
                      <span className={cn("text-xs font-bold", overdue ? "text-danger" : "text-caution")}>
                        {overdue ? `${Math.abs(diff)}m overdue` : `${diff}m left`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Expected: {moment(t.expected_arrival).format("h:mm A")}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Guardian contacts */}
          <div>
            <p className="text-sm font-bold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Emergency Guardians ({contacts.length})
            </p>

            {contacts.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-border rounded-2xl">
                <Bell className="w-10 h-10 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No guardians added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add family members to enable safety alerts</p>
                <Button size="sm" onClick={() => setShowAddContact(true)} className="mt-3 rounded-xl gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Guardian
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
                      {c.contact_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{c.contact_name}</p>
                      <p className="text-xs text-muted-foreground">{c.relationship || "Guardian"} · {c.phone}</p>
                      {c.email && <p className="text-[10px] text-muted-foreground truncate">{c.email}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={`tel:${c.phone}`}
                        className="w-8 h-8 rounded-full bg-safe/10 flex items-center justify-center text-safe">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button onClick={() => removeContact(c.id)}
                        className="w-8 h-8 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Safety tips */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-primary mb-2">Family Safety Tips</p>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <p>• Add email addresses to receive automatic ride & timer alerts</p>
              <p>• Use Guardian Mode before every solo trip</p>
              <p>• Keep Emergency Profile updated for first responders</p>
              <p>• Share the SOS feature with all family members</p>
            </div>
          </div>
        </div>
      )}

      {/* Add contact modal */}
      <AnimatePresence>
        {showAddContact && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && setShowAddContact(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
              className="w-full max-w-sm mx-auto bg-card rounded-3xl p-5 space-y-4 border border-border shadow-2xl">
              <div className="flex items-center justify-between">
                <p className="font-bold">Add Emergency Guardian</p>
                <button onClick={() => setShowAddContact(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              {[
                { key: "contact_name", placeholder: "Full name *", label: "Name" },
                { key: "phone", placeholder: "+234... *", label: "Phone" },
                { key: "email", placeholder: "email@example.com", label: "Email (for alerts)" },
                { key: "relationship", placeholder: "e.g. Spouse, Parent", label: "Relationship" },
              ].map(({ key, placeholder, label }) => (
                <div key={key}>
                  <label className="text-xs text-muted-foreground mb-1.5 block">{label}</label>
                  <Input value={newContact[key]} onChange={e => setNewContact(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder} className="rounded-xl" />
                </div>
              ))}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" onClick={() => setShowAddContact(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={addContact} disabled={saving || !newContact.contact_name || !newContact.phone}
                  className="flex-1 rounded-xl gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Plus className="w-4 h-4" /> Add</>}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}