import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SafetyScoreCard({ score, incidents, alerts }) {
  const scoreColor = score >= 75 ? "text-safe" : score >= 50 ? "text-caution" : "text-danger";
  const barColor = score >= 75 ? "bg-safe" : score >= 50 ? "bg-caution" : "bg-danger";
  const label = score >= 75 ? "Safe" : score >= 50 ? "Moderate Risk" : "High Risk";

  const factors = [
    { label: "Active Danger Incidents", value: incidents.filter(i => i.severity === "danger").length, good: v => v === 0 },
    { label: "Active Safety Alerts", value: alerts.filter(a => a.severity === "danger").length, good: v => v === 0 },
    { label: "Community Reports", value: incidents.length, good: v => v < 5 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="mx-4 my-3">
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">Area Safety Score</span>
          </div>
          <Link to="/emergency-dashboard" className="flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary">
            Details <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-3">
          <div className="relative w-16 h-16 shrink-0">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-muted/30" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3.5"
                strokeDasharray={`${(score / 100) * 88} 88`}
                strokeLinecap="round"
                className={scoreColor} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${scoreColor}`}>{score}</span>
          </div>
          <div className="flex-1">
            <p className={`text-base font-bold ${scoreColor}`}>{label}</p>
            <p className="text-[10px] text-muted-foreground mb-2">Based on real-time area data</p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{f.label}</span>
              <div className="flex items-center gap-1">
                {f.good(f.value)
                  ? <CheckCircle2 className="w-3 h-3 text-safe" />
                  : <AlertTriangle className="w-3 h-3 text-danger" />
                }
                <span className={cn("font-semibold", f.good(f.value) ? "text-safe" : "text-danger")}>{f.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}