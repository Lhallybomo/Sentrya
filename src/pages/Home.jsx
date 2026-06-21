import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Bell, Shield, Search, User } from "lucide-react";
import SOSButton from "../components/sos/SOSButton";
import HeroSection from "../components/home/HeroSection";
import IncidentsSection from "../components/home/IncidentsSection";
import RidesSection from "../components/home/RidesSection";
import TravelSection from "../components/home/TravelSection";
import AlertsSection from "../components/home/AlertsSection";
import MapSection from "../components/home/MapSection";
import SafetyScoreCard from "../components/home/SafetyScoreCard";
import QuickActionsGrid from "../components/home/QuickActionsGrid";

function computeSafetyScore(incidents, alerts) {
  let score = 100;
  const danger = incidents.filter(i => i.severity === "danger").length;
  const caution = incidents.filter(i => i.severity === "caution").length;
  const alertDanger = alerts.filter(a => a.severity === "danger").length;
  score -= danger * 15;
  score -= caution * 5;
  score -= alertDanger * 10;
  return Math.max(10, Math.min(100, score));
}

export default function Home() {
  const [incidents, setIncidents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [recentRides, setRecentRides] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("sentrya_incidents");
      if (cached) setIncidents(JSON.parse(cached));
    } catch {}

    loadAll();

    const unsubIncident = base44.entities.Incident.subscribe((event) => {
      if (event.type === "create") setIncidents((prev) => [event.data, ...prev]);
      else if (event.type === "update") setIncidents((prev) => prev.map((i) => i.id === event.id ? event.data : i));
      else if (event.type === "delete") setIncidents((prev) => prev.filter((i) => i.id !== event.id));
    });

    const unsubAlert = base44.entities.Alert.subscribe((event) => {
      if (event.type === "create") setAlerts((prev) => [event.data, ...prev]);
      else if (event.type === "update") setAlerts((prev) => prev.map((a) => a.id === event.id ? event.data : a));
      else if (event.type === "delete") setAlerts((prev) => prev.filter((a) => a.id !== event.id));
    });

    return () => { unsubIncident(); unsubAlert(); };
  }, []);

  async function loadAll() {
    const [incData, alertData] = await Promise.all([
      base44.entities.Incident.filter({ status: "active" }, "-created_date", 50),
      base44.entities.Alert.filter({ status: "active" }, "-created_date", 20),
    ]);
    setIncidents(incData);
    setAlerts(alertData);
    setAlertCount(alertData.length);
    localStorage.setItem("sentrya_incidents", JSON.stringify(incData));

    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const user = await base44.auth.me();
        const rides = await base44.entities.Ride.filter({ passenger_email: user.email }, "-created_date", 5);
        setRecentRides(rides);
      }
    } catch {}
  }

  const handleLocationFound = useCallback((latlng) => setUserLocation(latlng), []);
  const dangerCount = incidents.filter((i) => i.severity === "danger").length;
  const safetyScore = computeSafetyScore(incidents, alerts);

  return (
    <div className="min-h-screen bg-background">
      {/* Global top nav */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-2 flex items-center gap-3 safe-area-top">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold tracking-widest">SENTRYA</span>
        </div>
        <Link to="/travel" className="flex-1">
          <div className="bg-secondary rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Where are you travelling?</span>
          </div>
        </Link>
        <Link to="/alerts" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-danger text-white text-[8px] font-bold flex items-center justify-center">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>
        <Link to="/profile">
          <User className="w-5 h-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Scrollable content */}
      <div className="pb-28">
        <HeroSection dangerCount={dangerCount} alertCount={alertCount} safetyScore={safetyScore} />

        <SafetyScoreCard score={safetyScore} incidents={incidents} alerts={alerts} />

        <QuickActionsGrid />

        <div className="divide-y divide-border">
          <IncidentsSection incidents={incidents} />
          <RidesSection recentRides={recentRides} />
          <TravelSection />
          <AlertsSection alerts={alerts} />
          <MapSection
            incidents={incidents}
            userLocation={userLocation}
            onLocationFound={handleLocationFound}
          />
        </div>
      </div>

      {/* Floating SOS Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <SOSButton />
      </div>
    </div>
  );
}