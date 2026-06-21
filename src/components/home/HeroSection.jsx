import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Car, Bell, Shield, Zap } from "lucide-react";

export default function HeroSection({ dangerCount, alertCount, safetyScore }) {
  const scoreColor = safetyScore >= 75 ? "text-safe" : safetyScore >= 50 ? "text-caution" : "text-danger";
  const scoreBg = safetyScore >= 75 ? "from-safe/20 to-safe/5 border-safe/30" : safetyScore >= 50 ? "from-caution/20 to-caution/5 border-caution/30" : "from-danger/20 to-danger/5 border-danger/30";
  const scoreLabel = safetyScore >= 75 ? "Safe Zone" : safetyScore >= 50 ? "Moderate Risk" : "High Risk";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-900 px-5 pt-10 pb-8">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-safe/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-danger/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Brand row */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-white text-lg font-black tracking-widest">SENTRYA</span>
          <span className="text-primary/70 text-[9px] font-semibold ml-2 uppercase tracking-widest">Safety Platform</span>
        </div>
        {alertCount > 0 && (
          <span className="ml-auto bg-danger text-white text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse">
            {alertCount} LIVE ALERTS
          </span>
        )}
      </motion.div>

      {/* Safety Score */}
      {safetyScore !== undefined && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }}
          className={`mb-5 bg-gradient-to-r ${scoreBg} border rounded-2xl px-4 py-3 flex items-center gap-3`}>
          <div className="relative">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3"
                strokeDasharray={`${(safetyScore / 100) * 88} 88`}
                strokeLinecap="round"
                className={scoreColor} />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-black rotate-0 ${scoreColor}`}>{safetyScore}</span>
          </div>
          <div>
            <p className={`text-sm font-bold ${scoreColor}`}>{scoreLabel}</p>
            <p className="text-white/60 text-[10px]">Current safety score for your area</p>
          </div>
        </motion.div>
      )}

      {/* Headline */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="text-[28px] font-black text-white leading-tight mb-2">
          Your Personal Safety<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Assistant & Guardian</span>
        </h1>
        <p className="text-slate-400 text-xs leading-relaxed mb-5">
          Rides · Incidents · Guardian Mode · Emergency Response — all in one platform.
        </p>
      </motion.div>

      {/* Danger badge */}
      {dangerCount > 0 && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="mb-4 bg-danger/20 border border-danger/40 rounded-2xl px-4 py-2.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
          <p className="text-danger text-xs font-semibold">{dangerCount} high-danger incident{dangerCount !== 1 ? "s" : ""} active near you</p>
          <Link to="/emergency-dashboard" className="ml-auto text-danger/80 text-[10px] font-bold underline">View →</Link>
        </motion.div>
      )}

      {/* CTA grid */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-2">
        <Link to="/rides" className="w-full block">
          <button className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl text-sm shadow-xl shadow-primary/30 transition-all active:scale-[0.98]">
            <Car className="w-4 h-4" /> Book a Safe Ride
          </button>
        </Link>
        <div className="grid grid-cols-3 gap-2">
          <Link to="/guardian-mode" className="flex-1">
            <button className="w-full flex flex-col items-center justify-center gap-1 bg-white/8 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl text-xs border border-white/15 transition-all">
              <Shield className="w-4 h-4 text-primary" />
              <span>Guardian</span>
            </button>
          </Link>
          <Link to="/emergency-dashboard" className="flex-1">
            <button className="w-full flex flex-col items-center justify-center gap-1 bg-white/8 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl text-xs border border-white/15 transition-all">
              <Zap className="w-4 h-4 text-danger" />
              <span>Emergency</span>
            </button>
          </Link>
          <Link to="/alerts" className="flex-1">
            <button className="w-full flex flex-col items-center justify-center gap-1 bg-white/8 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl text-xs border border-white/15 transition-all">
              <Bell className="w-4 h-4 text-caution" />
              <span>Alerts</span>
            </button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}