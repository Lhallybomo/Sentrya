import { useState, useEffect, useCallback } from "react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { AlertTriangle, Plus, Filter, MapPin, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/nigeriaData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";

const severityBadge = {
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  caution: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  safe: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
};

const typeBadge = {
  "Security Threat": "bg-red-50 border-red-200",
  "Kidnapping": "bg-red-50 border-red-200",
  "Robbery": "bg-red-50 border-red-200",
  "Accident": "bg-orange-50 border-orange-200",
  "Traffic": "bg-amber-50 border-amber-200",
  "Bad Road": "bg-yellow-50 border-yellow-200",
  "Protest": "bg-purple-50 border-purple-200",
  "Flooding": "bg-blue-50 border-blue-200",
  "Fire": "bg-red-50 border-red-200",
  "Other": "bg-gray-50 border-gray-200",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("all");

  const handlePullRefresh = useCallback(async () => {
    const query = filterState && filterState !== "all" ? { status: "active", state: filterState } : { status: "active" };
    const data = await base44.entities.Incident.filter(query, "-created_date", 50);
    setIncidents(data);
  }, [filterState]);
  const { pullY, refreshing: pulling2refresh } = usePullToRefresh(handlePullRefresh);

  useEffect(() => {
    loadIncidents();
  }, [filterState]);

  async function loadIncidents() {
    setLoading(true);
    let data;
    if (filterState && filterState !== "all") {
      data = await base44.entities.Incident.filter({ status: "active", state: filterState }, "-created_date", 50);
    } else {
      data = await base44.entities.Incident.filter({ status: "active" }, "-created_date", 50);
    }
    setIncidents(data);
    setLoading(false);
  }

  // ── Optimistic upvote ──────────────────────────────────────────────
  const upvoteMutation = useMutation({
    mutationFn: async (inc) => {
      const newCount = (inc.upvotes || 0) + 1;
      await base44.entities.Incident.update(inc.id, { upvotes: newCount });
      return { id: inc.id, upvotes: newCount };
    },
    onMutate: (inc) => {
      // Optimistic: bump upvote count immediately
      setIncidents((prev) =>
        prev.map((i) => i.id === inc.id ? { ...i, upvotes: (i.upvotes || 0) + 1 } : i)
      );
    },
    onError: (_err, inc) => {
      // Roll back
      setIncidents((prev) =>
        prev.map((i) => i.id === inc.id ? { ...i, upvotes: Math.max(0, (i.upvotes || 1) - 1) } : i)
      );
    },
  });

  function timeAgo(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-background">
      <PullToRefreshIndicator pullY={pullY} refreshing={pulling2refresh} />
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Incidents</h1>
          <Link to="/incidents/report">
            <Button size="sm" className="rounded-xl gap-1.5">
              <Plus className="w-4 h-4" />
              Report
            </Button>
          </Link>
        </div>
        
        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="rounded-xl h-9 text-sm">
            <Filter className="w-3.5 h-3.5 mr-2" />
            <SelectValue placeholder="Filter by state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {NIGERIAN_STATES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : incidents.length === 0 ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No incidents reported</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.id}
              className={cn("rounded-2xl border p-4 bg-card", typeBadge[inc.type] || "bg-card border-border")}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", severityBadge[inc.severity])}>
                    {inc.severity?.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{timeAgo(inc.created_date)}</span>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{inc.type}</h3>
              <p className="text-xs text-muted-foreground mb-2">{inc.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {inc.location_name || inc.state}
                </div>
                <button
                  onClick={() => upvoteMutation.mutate(inc)}
                  disabled={upvoteMutation.isPending}
                  aria-label={`Confirm incident (${inc.upvotes || 0} confirmations)`}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground transition-colors min-h-[36px]"
                >
                  <ThumbsUp className="w-3 h-3" />
                  <span className="text-[11px] font-medium">{inc.upvotes || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}