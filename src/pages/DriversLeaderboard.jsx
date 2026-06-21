import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Star, Car, RefreshCw, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const MEDAL = ["🥇", "🥈", "🥉"];

export default function DriversLeaderboard() {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const all = await base44.entities.Driver.filter({ status: "approved" }, "-rating", 50);
    // Sort by composite score: rating*2 + total_trips*0.1
    const scored = all
      .map((d) => ({ ...d, score: (d.rating || 0) * 2 + (d.total_trips || 0) * 0.1 }))
      .sort((a, b) => b.score - a.score);
    setDrivers(scored);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 flex items-center gap-3 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2"><Trophy className="w-4 h-4 text-caution" /> Drivers Leaderboard</h1>
          <p className="text-xs text-muted-foreground">Top-rated by passengers</p>
        </div>
        <button onClick={load} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Top 3 Podium */}
        {drivers.length >= 3 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 0, 2].map((rankIdx) => {
              const d = drivers[rankIdx];
              const isFirst = rankIdx === 0;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rankIdx * 0.1 }}
                  className={cn("rounded-2xl border p-3 text-center",
                    isFirst ? "border-caution/40 bg-caution/5 scale-105 shadow-lg" : "border-border bg-card")}>
                  <div className="text-2xl mb-1">{MEDAL[rankIdx]}</div>
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-1",
                    isFirst ? "bg-caution/20 text-caution" : "bg-primary/10 text-primary")}>
                    {d.full_name?.[0] || "D"}
                  </div>
                  <p className="text-xs font-semibold truncate">{d.full_name}</p>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    <Star className="w-3 h-3 fill-caution text-caution" />
                    <span className="text-xs font-bold">{d.rating?.toFixed(1) || "—"}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{d.total_trips || 0} trips</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Car className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No drivers yet</p>
          </div>
        ) : (
          drivers.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
              <span className="text-lg font-bold text-muted-foreground w-7 text-center">
                {i < 3 ? MEDAL[i] : `#${i + 1}`}
              </span>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-base font-bold text-primary shrink-0">
                {d.full_name?.[0] || "D"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{d.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{d.vehicle_type} · {d.city}</p>
                <p className="text-xs text-muted-foreground">{d.vehicle_make} {d.vehicle_model}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center gap-0.5 justify-end">
                  <Star className="w-3.5 h-3.5 fill-caution text-caution" />
                  <span className="text-sm font-bold">{d.rating?.toFixed(1) || "N/A"}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">{d.total_trips || 0} trips</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}