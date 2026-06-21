import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Shield, Heart, History, Zap, Map, Users, Phone } from "lucide-react";

const ACTIONS = [
  { to: "/rides", icon: Car, label: "Book Ride", color: "bg-primary/10 text-primary", border: "border-primary/20" },
  { to: "/guardian-mode", icon: Shield, label: "Guardian", color: "bg-safe/10 text-safe", border: "border-safe/20" },
  { to: "/emergency-dashboard", icon: Zap, label: "Emergency", color: "bg-danger/10 text-danger", border: "border-danger/20" },
  { to: "/safe-places", icon: Map, label: "Safe Places", color: "bg-blue-500/10 text-blue-500", border: "border-blue-500/20" },
  { to: "/emergency-profile", icon: Heart, label: "Med Profile", color: "bg-rose-500/10 text-rose-500", border: "border-rose-500/20" },
  { to: "/trip-history", icon: History, label: "Trip History", color: "bg-caution/10 text-caution", border: "border-caution/20" },
  { to: "/family-safety", icon: Users, label: "Family Safety", color: "bg-purple-500/10 text-purple-500", border: "border-purple-500/20" },
  { to: "/emergency-contacts", icon: Phone, label: "Contacts", color: "bg-teal-500/10 text-teal-500", border: "border-teal-500/20" },
];

export default function QuickActionsGrid() {
  return (
    <div className="px-4 py-3">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</p>
      <div className="grid grid-cols-4 gap-2">
        {ACTIONS.map(({ to, icon: Icon, label, color, border }, i) => (
          <motion.div key={to} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
            <Link to={to}>
              <div className={`rounded-2xl border ${border} bg-card p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform`}>
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}