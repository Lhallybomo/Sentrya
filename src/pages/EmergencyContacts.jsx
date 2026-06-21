import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Plus, Trash2, Phone, User, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

export default function EmergencyContacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ contact_name: "", phone: "", email: "", relationship: "" });

  useEffect(() => {
    // Load cached contacts immediately for offline access
    try {
      const cached = localStorage.getItem("sentrya_emergency_contacts");
      if (cached) setContacts(JSON.parse(cached));
    } catch {}
    loadContacts();
  }, []);

  async function loadContacts() {
    setLoading(true);
    try {
      const user = await base44.auth.me();
      const data = await base44.entities.EmergencyContact.filter({ owner_email: user.email });
      setContacts(data);
      // Cache for offline access
      localStorage.setItem("sentrya_emergency_contacts", JSON.stringify(data));
    } catch {
      // Fall back to cache silently — already loaded above
    }
    setLoading(false);
  }

  async function saveContact() {
    if (!form.contact_name || !form.phone) return;
    setSaving(true);
    try {
      const user = await base44.auth.me();
      await base44.entities.EmergencyContact.create({ ...form, owner_email: user.email });
    } catch {
      setSaving(false);
      return;
    }
    setForm({ contact_name: "", phone: "", email: "", relationship: "" });
    setAdding(false);
    await loadContacts(); // also refreshes cache
    setSaving(false);
  }

  async function deleteContact(id) {
    await base44.entities.EmergencyContact.delete(id);
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    localStorage.setItem("sentrya_emergency_contacts", JSON.stringify(updated));
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Emergency Contacts</h1>
          <p className="text-xs text-muted-foreground">Notified on SOS & when rides start/complete</p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="rounded-xl gap-1">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3"
            >
              <h3 className="font-semibold text-sm">New Contact</h3>
              <Input placeholder="Full name *" value={form.contact_name} onChange={(e) => setForm(f => ({ ...f, contact_name: e.target.value }))} className="rounded-xl" />
              <Input placeholder="Phone (e.g. +2348012345678) *" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="rounded-xl" />
              <Input placeholder="Email address" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} className="rounded-xl" type="email" />
              <Input placeholder="Relationship (e.g. Sister, Friend)" value={form.relationship} onChange={(e) => setForm(f => ({ ...f, relationship: e.target.value }))} className="rounded-xl" />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAdding(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={saveContact} disabled={saving || !form.contact_name || !form.phone} className="flex-1 rounded-xl gap-1">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Save</>}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-16">
            <Phone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No emergency contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add someone to notify in an emergency</p>
          </div>
        ) : (
          contacts.map((c) => (
            <motion.div key={c.id} layout className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-danger" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{c.contact_name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>
                {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</p>}
                {c.relationship && <p className="text-xs text-muted-foreground">{c.relationship}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteContact(c.id)} className="rounded-xl text-muted-foreground hover:text-danger">
                <Trash2 className="w-4 h-4" />
              </Button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}