import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Shield, MapPin, AlertTriangle, CheckCircle, Clock, Car, Plane, Train, Ship } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function SafetyCheck() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkSafety() {
    if (!from || !to) return;
    setLoading(true);
    setResult(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a travel safety expert for Nigeria. A user wants to travel from ${from} to ${to}. Analyze the current safety situation and provide a detailed recommendation. Consider recent security events, road conditions, time of travel, and alternatives. Be specific and realistic about Nigerian travel conditions.`,
      response_json_schema: {
        type: "object",
        properties: {
          overall_status: { type: "string", enum: ["safe", "caution", "danger"] },
          summary: { type: "string" },
          recommendation: { type: "string", enum: ["road", "air", "train", "sea"] },
          recommendation_reason: { type: "string" },
          safety_tips: { type: "array", items: { type: "string" } },
          best_travel_time: { type: "string" },
          estimated_road_time: { type: "string" },
          risks: { type: "array", items: { type: "string" } }
        }
      },
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });

    setResult(res);
    setLoading(false);
  }

  const statusConfig = {
    safe: { icon: CheckCircle, color: "text-safe", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-200 dark:border-green-900", label: "Safe to Travel" },
    caution: { icon: AlertTriangle, color: "text-caution", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900", label: "Travel with Caution" },
    danger: { icon: AlertTriangle, color: "text-danger", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900", label: "Not Safe to Travel" },
  };

  const modeIcons = { road: Car, air: Plane, train: Train, sea: Ship };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-lg font-bold">Travel Safety Check</h1>
      </div>

      <div className="p-4 space-y-5">
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-safe" />
            <Input placeholder="From" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl pl-10" />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-danger" />
            <Input placeholder="To" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl pl-10" />
          </div>
          <Button onClick={checkSafety} disabled={loading || !from || !to} className="w-full h-11 rounded-xl font-semibold gap-2">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Check Safety
              </>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {result && (() => {
            const config = statusConfig[result.overall_status] || statusConfig.caution;
            const StatusIcon = config.icon;
            const RecIcon = modeIcons[result.recommendation] || Car;
            return (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className={cn("rounded-2xl border p-5", config.bg, config.border)}>
                  <div className="flex items-center gap-3 mb-3">
                    <StatusIcon className={cn("w-8 h-8", config.color)} />
                    <div>
                      <h2 className="font-bold text-lg">{config.label}</h2>
                      <p className="text-xs text-muted-foreground">{from} → {to}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{result.summary}</p>
                </div>

                <div className="rounded-2xl border border-border bg-card p-4">
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <RecIcon className="w-4 h-4 text-primary" />
                    Recommended: Travel by {result.recommendation}
                  </h3>
                  <p className="text-xs text-muted-foreground">{result.recommendation_reason}</p>
                  {result.estimated_road_time && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Road time: {result.estimated_road_time}
                    </p>
                  )}
                  {result.best_travel_time && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Best time: {result.best_travel_time}
                    </p>
                  )}
                </div>

                {result.risks?.length > 0 && (
                  <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4">
                    <h3 className="font-semibold text-sm mb-2 text-danger">⚠️ Risks</h3>
                    <ul className="space-y-1">
                      {result.risks.map((r, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.safety_tips?.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-4">
                    <h3 className="font-semibold text-sm mb-2">💡 Safety Tips</h3>
                    <ul className="space-y-1">
                      {result.safety_tips.map((t, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
}