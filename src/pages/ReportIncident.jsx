import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Camera, MapPin, Send, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NIGERIAN_STATES, INCIDENT_TYPES } from "@/lib/nigeriaData";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const severityOptions = [
  { value: "danger", label: "Danger", color: "bg-red-500", desc: "Immediate threat" },
  { value: "caution", label: "Caution", color: "bg-amber-500", desc: "Be careful" },
  { value: "safe", label: "Safe", color: "bg-green-500", desc: "Resolved/Minor" },
];

export default function ReportIncident() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    type: "",
    description: "",
    state: "",
    location_name: "",
    severity: "",
    photo_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  async function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    update("photo_url", file_url);
    setUploading(false);
  }

  async function handleSubmit() {
    if (!form.type || !form.description || !form.state || !form.severity) return;
    setSubmitting(true);

    // Use approximate coordinates for the state
    const stateCoords = {
      "Lagos": [6.5244, 3.3792], "Abuja": [9.0579, 7.4951], "FCT Abuja": [9.0579, 7.4951],
      "Rivers": [4.8156, 7.0498], "Kano": [12.0022, 8.5920], "Oyo": [7.3775, 3.9470],
      "Kaduna": [10.5105, 7.4165], "Edo": [6.3350, 5.6037], "Enugu": [6.4527, 7.5248],
      "Cross River": [4.9517, 8.3220], "Delta": [5.5167, 5.7500],
    };
    const coords = stateCoords[form.state] || [9.0820, 8.6753];

    await base44.entities.Incident.create({
      ...form,
      latitude: coords[0] + (Math.random() - 0.5) * 0.1,
      longitude: coords[1] + (Math.random() - 0.5) * 0.1,
      status: "active",
      upvotes: 0,
    });
    
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => navigate("/incidents"), 2000);
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-20 h-20 text-safe mb-4" />
        </motion.div>
        <h2 className="text-xl font-bold mb-2">Incident Reported!</h2>
        <p className="text-muted-foreground text-sm text-center">
          Thank you for helping keep travelers safe.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Report Incident</h1>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <label className="text-sm font-medium mb-2 block">Incident Type</label>
          <Select value={form.type} onValueChange={(v) => update("type", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {INCIDENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Severity</label>
          <div className="grid grid-cols-3 gap-2">
            {severityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("severity", opt.value)}
                className={cn(
                  "rounded-xl p-3 border-2 transition-all text-center",
                  form.severity === opt.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className={cn("w-4 h-4 rounded-full mx-auto mb-1.5", opt.color)} />
                <p className="text-xs font-semibold">{opt.label}</p>
                <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">State</label>
          <Select value={form.state} onValueChange={(v) => update("state", v)}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent>
              {NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Location</label>
          <Input
            placeholder="e.g. Lekki-Epe Expressway"
            value={form.location_name}
            onChange={(e) => update("location_name", e.target.value)}
            className="rounded-xl"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Description</label>
          <Textarea
            placeholder="Describe what happened..."
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className="rounded-xl min-h-[100px]"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Photo (Optional)</label>
          <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 cursor-pointer hover:border-primary/50 transition-colors">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : form.photo_url ? (
              <img src={form.photo_url} alt="Uploaded" className="w-24 h-24 object-cover rounded-xl" />
            ) : (
              <>
                <Camera className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload photo</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !form.type || !form.description || !form.state || !form.severity}
          className="w-full h-12 rounded-xl text-base font-semibold gap-2"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}