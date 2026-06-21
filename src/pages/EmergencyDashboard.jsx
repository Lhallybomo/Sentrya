import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertTriangle, Bell, MapPin, Clock, Shield, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import moment from "moment";
import SOSButton from "@/components/sos/SOSButton";

const SEVERITY_STYLES = {
  danger: { card: "border-danger/40 bg-danger/5", badge: "bg-danger/10 text-danger", dot: "bg-danger" },
  caution: { card: "border-caution/40 bg-caution/5", badge: "bg-caution/10 text-caution", dot: "bg-caution" },
  safe: { card: "border-safe/30 bg-safe/5", badge: "bg-safe/10 text-safe", dot: "bg-safe" },
};

export default function EmergencyDashboard() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("incidents");

  useEffect(() => {
    load();
    const unsubI = base44.entities.Incident.subscribe((e) => {
      if (e.type === "create") setIncidents((p) => [e.data, ...p]);
      else if (e.type === "update") setIncidents((p) => p.map((i) => i.id === e.id ? e.data : i));
      else if (e.type === "delete") setIncidents((p) => p.filter((i) => i.id !== e.id));
    });
    const unsubA = base44.entities.Alert.subscribe((e) => {
      if (e.type === "create") setAlerts((p) => [e.data, ...p]);
      else if (e.type === "update") setAlerts((p) => p.map((a) => a.id === e.id ? e.data : a));
      else if (e.type === "delete") setAlerts((p) => p.filter((a) => a.id !== e.id));
    });
    return () => { unsubI(); unsubA(); };
  }, []);

  async function load() {
    setLoading(true);
    const [inc, alts] = await Promise.all([
      base44.entities.Incident.filter({ status: "active" }, "-created_date", 50),
      base44.entities.Alert.filter({ status: "active" }, "-created_date", 30),
    ]);
    // Sort danger first
    setIncidents(inc.sort((a, b) => {
      const order = { danger: 0, caution: 1, safe: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    }));
    setAlerts(alts.sort((a, b) => {
      const order = { danger: 0, caution: 1, safe: 2 };
      return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
    }));
    setLoading(false);
  }

  const dangerIncidents = incidents.filter((i) => i.severity === "danger");
  const dangerAlerts = alerts.filter((a) => a.severity === "danger");

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-4 h-4 text-danger" />
              Emergency Dashboard
            </h1>
          </div>
          <button onClick={load} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Summary bar */}
        <div className="flex gap-2">
          <div className={cn("flex-1 rounded-xl p-2.5 text-center", dangerIncidents.length > 0 ? "bg-danger/10 border border-danger/30" : "bg-muted/50 border border-border")}>
            <p className={cn("text-lg font-bold", dangerIncidents.length > 0 ? "text-danger" : "text-foreground")}>{dangerIncidents.length}</p>
            <p className="text-[10px] text-muted-foreground">Danger Incidents</p>
          </div>
          <div className={cn("flex-1 rounded-xl p-2.5 text-center", dangerAlerts.length > 0 ? "bg-danger/10 border border-danger/30" : "bg-muted/50 border border-border")}>
            <p className={cn("text-lg font-bold", dangerAlerts.length > 0 ? "text-danger" : "text-foreground")}>{dangerAlerts.length}</p>
            <p className="text-[10px] text-muted-foreground">Active Alerts</p>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center bg-muted/50 border border-border">
            <p className="text-lg font-bold">{incidents.length + alerts.length}</p>
            <p className="text-[10px] text-muted-foreground">Total Active</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          {[
            { id: "incidents", label: `Incidents (${incidents.length})` },
            { id: "alerts", label: `Alerts (${alerts.length})` },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex-1 py-2 rounded-xl text-xs font-semibold transition-colors",
                tab === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === "incidents" ? (
          incidents.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active incidents</p>
            </div>
          ) : incidents.map((inc) => {
            const style = SEVERITY_STYLES[inc.severity] || SEVERITY_STYLES.safe;
            return (
              <div key={inc.id} className={cn("rounded-2xl border p-4", style.card)}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse shrink-0", style.dot)} />
                    <span className="font-semibold text-sm">{inc.type}</span>
                  </div>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", style.badge)}>
                    {inc.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{inc.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.location_name || inc.state}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{moment(inc.created_date).fromNow()}</span>
                </div>
              </div>
            );
          })
        ) : (
          alerts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.safe;
            return (
              <div key={alert.id} className={cn("rounded-2xl border p-4", style.card)}>
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-sm">{alert.title}</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0", style.badge)}>
                    {alert.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>{alert.state || alert.city || "Nationwide"}</span>
                  <span>{moment(alert.created_date).fromNow()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* SOS floating */}
      <div className="fixed bottom-6 right-4 z-40">
        <SOSButton />
      </div>
    </div>
  );
}