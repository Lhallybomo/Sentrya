import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bell, Shield, AlertTriangle, MapPin, ChevronRight, Flame, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  incident: AlertTriangle,
  traffic: AlertTriangle,
  travel_warning: Shield,
  security: Shield,
  weather: Droplets,
  general: Bell,
};

const SEVERITY_STYLES = {
  danger: "border-l-danger bg-danger/5",
  caution: "border-l-caution bg-caution/5",
  safe: "border-l-safe bg-safe/5",
};

const SEVERITY_BADGE = {
  danger: "bg-danger/10 text-danger",
  caution: "bg-caution/10 text-caution",
  safe: "bg-safe/10 text-safe",
};

export default function AlertsSection({ alerts = [] }) {
  const recent = alerts.slice(0, 4);
  const dangerCount = alerts.filter((a) => a.severity === "danger").length;

  return (
    <section className="px-4 py-5 bg-secondary/30">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-caution/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-caution" />
          </div>
          <div>
            <h2 className="text-base font-bold">Alerts</h2>
            <p className="text-[10px] text-muted-foreground">Live safety intelligence</p>
          </div>
        </div>
        <Link to="/alerts" className="flex items-center gap-1 text-xs text-primary font-medium">
          See all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {dangerCount > 0 && (
        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 mb-3">
          <Flame className="w-3.5 h-3.5 text-danger shrink-0" />
          <p className="text-xs text-danger font-semibold">{dangerCount} high-danger alert{dangerCount !== 1 ? "s" : ""} active</p>
        </div>
      )}

      {recent.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-6 text-center text-muted-foreground text-sm">
          No active alerts — all clear
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((alert, i) => {
            const Icon = TYPE_ICON[alert.type] || Bell;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "bg-card rounded-2xl border border-border border-l-4 p-3 flex items-start gap-3",
                  SEVERITY_STYLES[alert.severity]
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0",
                  alert.severity === "danger" ? "text-danger" :
                  alert.severity === "caution" ? "text-caution" : "text-safe"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{alert.title}</p>
                  {(alert.city || alert.state) && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">{[alert.city, alert.state].filter(Boolean).join(", ")}</p>
                    </div>
                  )}
                </div>
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0", SEVERITY_BADGE[alert.severity])}>
                  {alert.severity}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      <Link to="/alerts">
        <button className="mt-3 w-full bg-primary text-primary-foreground rounded-2xl py-2.5 text-xs font-semibold hover:bg-primary/90 transition-colors">
          View All Alerts & Intelligence
        </button>
      </Link>
    </section>
  );
}