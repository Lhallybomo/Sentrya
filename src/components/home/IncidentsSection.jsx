import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin, ChevronRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES = {
  danger: { dot: "bg-danger", badge: "bg-danger/10 text-danger", label: "Danger" },
  caution: { dot: "bg-caution", badge: "bg-caution/10 text-caution", label: "Caution" },
  safe: { dot: "bg-safe", badge: "bg-safe/10 text-safe", label: "Safe" },
};

export default function IncidentsSection({ incidents = [] }) {
  const recent = incidents.slice(0, 4);
  const dangerCount = incidents.filter((i) => i.severity === "danger").length;
  const cautionCount = incidents.filter((i) => i.severity === "caution").length;

  return (
    <section className="px-4 py-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-danger/10 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-danger" />
          </div>
          <div>
            <h2 className="text-base font-bold">Incidents</h2>
            <p className="text-[10px] text-muted-foreground">Safety reports & risk zones</p>
          </div>
        </div>
        <Link to="/incidents" className="flex items-center gap-1 text-xs text-primary font-medium">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Summary pills */}
      <div className="flex gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-danger/10 rounded-xl px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" />
          <span className="text-[11px] font-semibold text-danger">{dangerCount} Danger</span>
        </div>
        <div className="flex items-center gap-1.5 bg-caution/10 rounded-xl px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-caution" />
          <span className="text-[11px] font-semibold text-caution">{cautionCount} Caution</span>
        </div>
        <Link to="/incidents" className="flex items-center gap-1.5 bg-primary/10 rounded-xl px-3 py-1.5 ml-auto">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-semibold text-primary">{incidents.length} Active</span>
        </Link>
      </div>

      {/* Incident cards */}
      {recent.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
          No active incidents reported
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((inc, i) => {
            const s = SEVERITY_STYLES[inc.severity] || SEVERITY_STYLES.caution;
            return (
              <motion.div
                key={inc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-2xl border border-border p-3 flex items-center gap-3"
              >
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", s.dot)} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{inc.type}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground truncate">{inc.location_name || inc.state}</p>
                  </div>
                </div>
                <span className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0", s.badge)}>
                  {s.label}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Report CTA */}
      <Link to="/incidents/report">
        <button className="mt-3 w-full border border-danger/30 text-danger rounded-2xl py-2.5 text-xs font-semibold hover:bg-danger/5 transition-colors">
          + Report an Incident
        </button>
      </Link>
    </section>
  );
}