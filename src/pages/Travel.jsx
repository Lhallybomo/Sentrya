import { useState } from "react";
import TrainRoutes from "../components/travel/TrainRoutes";
import BookingLinks from "../components/travel/BookingLinks";
import { Car, Plane, Train, Ship, Shield, Clock, Banknote, ChevronRight, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { CITY_COORDS } from "@/lib/nigeriaData";
import TravelBudgetTracker from "../components/travel/TravelBudgetTracker";

const transportIcons = { road: Car, air: Plane, train: Train, sea: Ship };

export default function Travel() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState(null);
  const [activeTab, setActiveTab] = useState("ai"); // ai | train | flight | sea

  async function searchTravel() {
    if (!from || !to) return;
    setLoading(true);
    setResults(null);
    setSafetyCheck(null);

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Nigerian travel advisor. Give me travel options from ${from} to ${to} in Nigeria.
For each available transport mode (road, air, train, sea), provide realistic data.
Also provide a safety assessment for road travel.
Consider current conditions in Nigeria.`,
      response_json_schema: {
        type: "object",
        properties: {
          options: {
            type: "array",
            items: {
              type: "object",
              properties: {
                mode: { type: "string", enum: ["road", "air", "train", "sea"] },
                available: { type: "boolean" },
                duration: { type: "string" },
                price_range: { type: "string" },
                safety_score: { type: "number" },
                safety_level: { type: "string", enum: ["safe", "caution", "danger"] },
                notes: { type: "string" },
                booking_tip: { type: "string" }
              }
            }
          },
          road_safety: {
            type: "object",
            properties: {
              status: { type: "string", enum: ["safe", "caution", "danger"] },
              advice: { type: "string" },
              best_time: { type: "string" },
              warnings: { type: "array", items: { type: "string" } }
            }
          }
        }
      },
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });

    setResults(res.options || []);
    setSafetyCheck(res.road_safety || null);
    setLoading(false);
  }

  const safetyColors = {
    safe: "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900",
    caution: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900",
    danger: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900",
  };

  const safetyIcons = {
    safe: CheckCircle,
    caution: AlertTriangle,
    danger: AlertTriangle,
  };

  const safetyTextColors = {
    safe: "text-safe",
    caution: "text-caution",
    danger: "text-danger",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3">
        <h1 className="text-xl font-bold">Travel Options</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Compare routes across Nigeria</p>
        <div className="flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {[
            { id: "ai", label: "🤖 AI Advisor" },
            { id: "train", label: "🚂 Train" },
            { id: "flight", label: "✈️ Flights" },
            { id: "sea", label: "🚢 Sea" },
            { id: "budget", label: "💰 Budget" },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === "ai" && (
          <>
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <Input placeholder="From (e.g. Lagos)" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl" />
              <Input placeholder="To (e.g. Abuja)" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl" />
              <Button onClick={searchTravel} disabled={loading || !from || !to} className="w-full rounded-xl h-11 font-semibold gap-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Shield className="w-4 h-4" /> Should I Travel?</>
                )}
              </Button>
            </div>

            <AnimatePresence>
              {safetyCheck && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-2xl border p-4", safetyColors[safetyCheck.status])}>
                  {(() => {
                    const SafeIcon = safetyIcons[safetyCheck.status] || AlertTriangle;
                    return (
                      <div className="flex items-start gap-3">
                        <SafeIcon className={cn("w-6 h-6 shrink-0", safetyTextColors[safetyCheck.status])} />
                        <div>
                          <h3 className="font-bold text-sm mb-1">
                            {safetyCheck.status === "safe" && "Safe to Travel"}
                            {safetyCheck.status === "caution" && "Travel with Caution"}
                            {safetyCheck.status === "danger" && "Not Safe to Travel"}
                          </h3>
                          <p className="text-xs text-muted-foreground mb-2">{safetyCheck.advice}</p>
                          {safetyCheck.best_time && (
                            <p className="text-xs"><span className="font-medium">Best time:</span> {safetyCheck.best_time}</p>
                          )}
                          {safetyCheck.warnings?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {safetyCheck.warnings.map((w, i) => (
                                <p key={i} className="text-xs text-muted-foreground">⚠️ {w}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
              )}

              {results && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <h2 className="text-sm font-semibold text-muted-foreground px-1">Transport Options</h2>
                  {results.map((opt, i) => {
                    const Icon = transportIcons[opt.mode] || Car;
                    if (!opt.available) return null;
                    return (
                      <motion.div key={opt.mode} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn("rounded-2xl border bg-card p-4", opt.safety_level === "safe" && "ring-2 ring-safe/30")}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm capitalize">{opt.mode}</h3>
                            <p className="text-xs text-muted-foreground">{opt.notes}</p>
                          </div>
                          {opt.safety_level === "safe" && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">SAFEST</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-muted-foreground" />{opt.duration}</div>
                          <div className="flex items-center gap-1"><Banknote className="w-3.5 h-3.5 text-muted-foreground" />{opt.price_range}</div>
                          <div className="flex items-center gap-1"><Shield className={cn("w-3.5 h-3.5", safetyTextColors[opt.safety_level])} />{opt.safety_score}/10</div>
                        </div>
                        {opt.booking_tip && (
                          <p className="text-[10px] text-muted-foreground mt-2 italic">{opt.booking_tip}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {activeTab === "train" && (
          <TrainRoutes searchFrom={from} searchTo={to} />
        )}

        {activeTab === "flight" && <BookingLinks mode="flight" />}

        {activeTab === "sea" && <BookingLinks mode="sea" />}

        {activeTab === "budget" && <TravelBudgetTracker />}
      </div>
    </div>
  );
}