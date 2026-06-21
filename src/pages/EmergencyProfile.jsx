import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Heart, ArrowLeft, Save, User, Phone, AlertCircle, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];

export default function EmergencyProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    blood_group: "Unknown",
    allergies: "",
    medical_conditions: "",
    medications: "",
    next_of_kin_name: "",
    next_of_kin_phone: "",
    next_of_kin_relationship: "",
    doctor_name: "",
    doctor_phone: "",
  });
  const [profileId, setProfileId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const u = await base44.auth.me();
      setUser(u);
      const existing = await base44.entities.EmergencyProfile.filter({ owner_email: u.email });
      if (existing.length > 0) {
        const p = existing[0];
        setProfileId(p.id);
        setProfile({
          blood_group: p.blood_group || "Unknown",
          allergies: p.allergies || "",
          medical_conditions: p.medical_conditions || "",
          medications: p.medications || "",
          next_of_kin_name: p.next_of_kin_name || "",
          next_of_kin_phone: p.next_of_kin_phone || "",
          next_of_kin_relationship: p.next_of_kin_relationship || "",
          doctor_name: p.doctor_name || "",
          doctor_phone: p.doctor_phone || "",
        });
      }
    } catch {}
  }

  async function save() {
    if (!user) return;
    setSaving(true);
    const data = { ...profile, owner_email: user.email };
    if (profileId) {
      await base44.entities.EmergencyProfile.update(profileId, data);
    } else {
      const created = await base44.entities.EmergencyProfile.create(data);
      setProfileId(created.id);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const update = (key, val) => setProfile((p) => ({ ...p, [key]: val }));

  // eslint-disable-next-line no-unused-vars
  const Section = ({ icon: Icon, title, children }) => (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <p className="font-semibold text-sm">{title}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Emergency Profile</h1>
          <p className="text-xs text-muted-foreground">Critical info for responders</p>
        </div>
        <Button size="sm" onClick={save} disabled={saving} className="rounded-xl gap-1.5">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
            saved ? "Saved ✓" : <><Save className="w-3.5 h-3.5" /> Save</>}
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-2xl bg-danger/5 border border-danger/20 p-3">
          <p className="text-xs text-danger font-medium flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            This info is shared with emergency contacts when you trigger SOS
          </p>
        </div>

        <Section icon={Heart} title="Medical Information">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Blood Group</label>
            <Select value={profile.blood_group} onValueChange={(v) => update("blood_group", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Allergies</label>
            <Input value={profile.allergies} onChange={(e) => update("allergies", e.target.value)}
              placeholder="e.g. Penicillin, Peanuts" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Medical Conditions</label>
            <Input value={profile.medical_conditions} onChange={(e) => update("medical_conditions", e.target.value)}
              placeholder="e.g. Diabetes, Hypertension" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Current Medications</label>
            <Input value={profile.medications} onChange={(e) => update("medications", e.target.value)}
              placeholder="e.g. Metformin 500mg" className="rounded-xl" />
          </div>
        </Section>

        <Section icon={User} title="Next of Kin">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
            <Input value={profile.next_of_kin_name} onChange={(e) => update("next_of_kin_name", e.target.value)}
              placeholder="Next of kin name" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Phone Number</label>
            <Input value={profile.next_of_kin_phone} onChange={(e) => update("next_of_kin_phone", e.target.value)}
              placeholder="+234..." className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Relationship</label>
            <Input value={profile.next_of_kin_relationship} onChange={(e) => update("next_of_kin_relationship", e.target.value)}
              placeholder="e.g. Spouse, Parent, Sibling" className="rounded-xl" />
          </div>
        </Section>

        <Section icon={Phone} title="Doctor / Hospital">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Doctor Name</label>
            <Input value={profile.doctor_name} onChange={(e) => update("doctor_name", e.target.value)}
              placeholder="Dr. Adeyemi" className="rounded-xl" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Doctor Phone</label>
            <Input value={profile.doctor_phone} onChange={(e) => update("doctor_phone", e.target.value)}
              placeholder="+234..." className="rounded-xl" />
          </div>
        </Section>

        <Button onClick={save} disabled={saving} className="w-full h-11 rounded-xl font-semibold gap-2">
          {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> :
            saved ? "✓ Profile Saved!" : <><Save className="w-4 h-4" /> Save Emergency Profile</>}
        </Button>
      </div>
    </div>
  );
}