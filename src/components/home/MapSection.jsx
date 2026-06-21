import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layers, ChevronRight, RefreshCw } from "lucide-react";
import MapView from "../map/MapView";
import { cn } from "@/lib/utils";

const LAYER_FILTERS = [
  { id: "all", label: "All", color: "bg-primary text-primary-foreground" },
  { id: "Accident", label: "Accidents", color: "bg-danger/10 text-danger" },
  { id: "Traffic", label: "Traffic", color: "bg-caution/10 text-caution" },
  { id: "Flooding", label: "Flooding", color: "bg-chart-5/10 text-chart-5" },
  { id: "Security Threat", label: "Security", color: "bg-danger/10 text-danger" },
  { id: "Robbery", label: "Crime", color: "bg-red-700/10 text-red-700" },
  { id: "Bad Road", label: "Bad Roads", color: "bg-amber-700/10 text-amber-700" },
  { id: "Protest", label: "Protest", color: "bg-orange-500/10 text-orange-500" },
];

export default function MapSection({ incidents = [], userLocation, onLocationFound }) {
  const [activeLayer, setActiveLayer] = useState("all");

  const filtered = activeLayer === "all"
    ? incidents
    : incidents.filter((i) => i.type === activeLayer);

  return (
    <section className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Live Map</h2>
            <p className="text-[10px] text-muted-foreground">{incidents.length} active incidents</p>
          </div>
        </div>
        <Link to="/incidents" className="flex items-center gap-1 text-xs text-primary font-medium">
          Full map <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Layer filter chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-1">
        {LAYER_FILTERS.map(({ id, label, color }) => (
          <button
            key={id}
            onClick={() => setActiveLayer(id)}
            className={cn(
              "shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
              activeLayer === id
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : `${color} border-transparent bg-card border-border`
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="rounded-3xl overflow-hidden border border-border shadow-lg" style={{ height: 280 }}>
        <MapView
          incidents={filtered}
          userLocation={userLocation}
          onLocationFound={onLocationFound}
          className="h-full w-full"
        />
      </div>

      {/* Layer count */}
      <div className="flex items-center justify-between mt-2 px-1">
        <p className="text-[10px] text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> {activeLayer === "all" ? "total" : activeLayer} incident{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" />Danger</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-caution" />Caution</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-safe" />Safe</span>
        </div>
      </div>
    </section>
  );
}