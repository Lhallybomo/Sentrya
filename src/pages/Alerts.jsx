import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, AlertTriangle, Shield, MapPin, Clock, RefreshCw, Filter, Flame, Droplets, Users, Eye } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const NIGERIA_STATES = [
  "All States","Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun",
  "Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

const severityStyles = {
  danger: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
  caution: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
  safe: "border-l-green-500 bg-green-50/50 dark:bg-green-950/20",
};

const typeConfig = {
  incident: { icon: AlertTriangle, label: "Incident" },
  traffic: { icon: AlertTriangle, label: "Traffic" },
  travel_warning: { icon: Shield, label: "Travel Warning" },
  security: { icon: Shield, label: "Security" },
  weather: { icon: Droplets, label: "Weather" },
  general: { icon: Bell, label: "General" },
};

const categoryFilters = [
  { id: "all", label: "All" },
  { id: "security", label: "Security" },
  { id: "traffic", label: "Traffic" },
  { id: "incident", label: "Incidents" },
  { id: "weather", label: "Weather" },
  { id: "travel_warning", label: "Warnings" },
];

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stateFilter, setStateFilter] = useState("All States");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const handlePullRefresh = useCallback(async () => {
    const data = await base44.entities.Alert.filter({ status: "active" }, "-created_date", 100);
    setAlerts(data);
  }, []);
  const { pulling, pullY, refreshing: pulling2refresh } = usePullToRefresh(handlePullRefresh);

  useEffect(() => {
    loadAlerts();
    const unsubscribe = base44.entities.Alert.subscribe((event) => {
      if (event.type === "create") setAlerts((prev) => [event.data, ...prev]);
      else if (event.type === "update") setAlerts((prev) => prev.map((a) => a.id === event.id ? event.data : a));
      else if (event.type === "delete") setAlerts((prev) => prev.filter((a) => a.id !== event.id));
    });
    return unsubscribe;
  }, []);

  async function loadAlerts() {
    setLoading(true);
    const data = await base44.entities.Alert.filter({ status: "active" }, "-created_date", 100);
    setAlerts(data);
    setLoading(false);
  }

  async function fetchLiveAlerts() {
    setRefreshing(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Nigerian security and travel intelligence analyst. Generate 8 realistic, detailed safety and travel alerts across ALL regions of Nigeria including: Lagos, Abuja (FCT), Rivers, Kano, Kaduna, Oyo, Enugu, Delta, Anambra, Borno, and other states. Cover: crime reports, kidnap risks, road accidents, protests/unrest, flooding, unsafe zones, traffic danger, and suspicious activity. Be specific with location names, roads, and areas. Make alerts actionable.`,
      response_json_schema: {
        type: "object",
        properties: {
          alerts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string", enum: ["incident", "traffic", "travel_warning", "security", "weather", "general"] },
                state: { type: "string" },
                city: { type: "string" },
                severity: { type: "string", enum: ["safe", "caution", "danger"] }
              }
            }
          }
        }
      },
      add_context_from_internet: true,
      model: "gemini_3_flash"
    });

    if (res.alerts) {
      for (const alert of res.alerts) {
        await base44.entities.Alert.create({ ...alert, status: "active" });
      }
      await loadAlerts();
    }
    setRefreshing(false);
  }

  function timeAgo(date) {
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  const filtered = alerts.filter((a) => {
    const stateMatch = stateFilter === "All States" || a.state === stateFilter;
    const catMatch = categoryFilter === "all" || a.type === categoryFilter;
    return stateMatch && catMatch;
  });

  const dangerCount = filtered.filter((a) => a.severity === "danger").length;

  return (
    <div className="min-h-screen bg-background">
      <PullToRefreshIndicator pullY={pullY} refreshing={pulling2refresh} />
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border safe-area-top">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Alerts & Intelligence</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Nationwide coverage across Nigeria</p>
          </div>
          <Button size="sm" variant="outline" onClick={fetchLiveAlerts} disabled={refreshing} className="rounded-xl gap-1.5">
            <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin")} />
            {refreshing ? "Fetching..." : "Refresh"}
          </Button>
        </div>

        {/* Danger summary bar */}
        {dangerCount > 0 && (
          <div className="mx-4 mb-2 bg-danger/10 border border-danger/20 rounded-xl px-3 py-2 flex items-center gap-2">
            <Flame className="w-4 h-4 text-danger shrink-0" />
            <p className="text-xs text-danger font-semibold">{dangerCount} high-danger alert{dangerCount !== 1 ? "s" : ""} active</p>
          </div>
        )}

        {/* State filter */}
        <div className="px-4 pb-2 flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="rounded-xl text-xs h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NIGERIA_STATES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} alerts</span>
        </div>

        {/* Category filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {categoryFilters.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={cn(
                "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors",
                categoryFilter === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm mb-4">
              {alerts.length === 0 ? "No alerts yet" : "No alerts match your filters"}
            </p>
            {alerts.length === 0 && (
              <Button onClick={fetchLiveAlerts} disabled={refreshing} className="rounded-xl gap-2">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                Fetch Live Alerts
              </Button>
            )}
          </div>
        ) : (
          filtered.map((alert, i) => {
            const { icon: Icon } = typeConfig[alert.type] || typeConfig.general;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn("rounded-2xl border border-border bg-card p-4 border-l-4", severityStyles[alert.severity])}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                    alert.severity === "danger" && "bg-red-100 dark:bg-red-900/30",
                    alert.severity === "caution" && "bg-amber-100 dark:bg-amber-900/30",
                    alert.severity === "safe" && "bg-green-100 dark:bg-green-900/30",
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      alert.severity === "danger" && "text-danger",
                      alert.severity === "caution" && "text-caution",
                      alert.severity === "safe" && "text-safe",
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <h3 className="font-semibold text-sm leading-tight">{alert.title}</h3>
                      <span className={cn(
                        "shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase",
                        alert.severity === "danger" && "bg-danger/10 text-danger",
                        alert.severity === "caution" && "bg-caution/10 text-caution",
                        alert.severity === "safe" && "bg-safe/10 text-safe",
                      )}>{alert.severity}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                      {(alert.city || alert.state) && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {[alert.city, alert.state].filter(Boolean).join(", ")}
                        </span>
                      )}
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {timeAgo(alert.created_date)}
                      </span>
                      <span className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded-full">
                        {typeConfig[alert.type]?.label || "General"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}