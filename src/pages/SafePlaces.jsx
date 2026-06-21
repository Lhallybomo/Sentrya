import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Navigation, Search, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
const PLACE_TYPES = [
  { id: "police", label: "Police", icon: "🚔", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", query: "police station" },
  { id: "hospital", label: "Hospital", icon: "🏥", color: "bg-red-500/10 text-red-600 border-red-500/20", query: "hospital" },
  { id: "pharmacy", label: "Pharmacy", icon: "💊", color: "bg-green-500/10 text-green-600 border-green-500/20", query: "pharmacy" },
  { id: "fuel", label: "Fuel Station", icon: "⛽", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20", query: "fuel station petrol" },
  { id: "fire", label: "Fire Station", icon: "🚒", color: "bg-orange-500/10 text-orange-600 border-orange-500/20", query: "fire station" },
  { id: "shelter", label: "Safe Shelter", icon: "🏠", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", query: "community center" },
];

export default function SafePlaces() {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState("police");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [search, setSearch] = useState("");
  const [locationName, setLocationName] = useState("");

  useEffect(() => { getUserLocation(); }, []);

  function getUserLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setUserCoords({ lat, lng });
      // Reverse geocode to get area name
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        setLocationName(data.address?.suburb || data.address?.city_district || data.address?.city || "Your Location");
      } catch {}
      fetchNearbyPlaces({ lat, lng }, activeType);
    }, () => {
      // Default to Lagos center
      setUserCoords({ lat: 6.5244, lng: 3.3792 });
      setLocationName("Lagos");
      fetchNearbyPlaces({ lat: 6.5244, lng: 3.3792 }, activeType);
    });
  }

  async function fetchNearbyPlaces(coords, typeId) {
    setLoading(true);
    const type = PLACE_TYPES.find(t => t.id === typeId);
    if (!type) { setLoading(false); return; }
    try {
      const { lat, lng } = coords || userCoords || { lat: 6.5244, lng: 3.3792 };
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(type.query)}&lat=${lat}&lon=${lng}&format=json&limit=15&countrycodes=ng`
      );
      const data = await res.json();
      const sorted = data.map(p => ({
        id: p.place_id,
        name: p.display_name.split(",")[0],
        address: p.display_name.split(",").slice(1, 3).join(",").trim(),
        lat: parseFloat(p.lat),
        lng: parseFloat(p.lon),
        distance: calcDistance(lat, lng, parseFloat(p.lat), parseFloat(p.lon)),
      })).sort((a, b) => a.distance - b.distance);
      setPlaces(sorted);
    } catch {
      setPlaces([]);
    }
    setLoading(false);
  }

  function calcDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  function handleTypeChange(typeId) {
    setActiveType(typeId);
    if (userCoords) fetchNearbyPlaces(userCoords, typeId);
  }

  function openNavigation(place) {
    window.open(`https://maps.google.com/?q=${place.lat},${place.lng}`, "_blank");
  }

  const filtered = places.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.address.toLowerCase().includes(search.toLowerCase())
  );

  const activeTypeConfig = PLACE_TYPES.find(t => t.id === activeType);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 safe-area-top">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Safe Places</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {locationName || "Detecting location..."}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={getUserLocation} className="rounded-xl gap-1.5">
            <Crosshair className="w-3.5 h-3.5" /> Locate Me
          </Button>
        </div>

        {/* Type filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {PLACE_TYPES.map((t) => (
            <button key={t.id} onClick={() => handleTypeChange(t.id)}
              className={cn("shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all",
                activeType === t.id ? "bg-primary text-white border-primary shadow-md" : "bg-card border-border text-muted-foreground"
              )}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${activeTypeConfig?.label || "places"}...`} className="rounded-xl pl-10" />
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">No {activeTypeConfig?.label} found nearby</p>
            <p className="text-xs mt-1">Try changing your location or category</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground font-medium">{filtered.length} {activeTypeConfig?.label} locations found</p>
            {filtered.map((place, i) => (
              <motion.div key={place.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card rounded-2xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0", activeTypeConfig?.color)}>
                    {activeTypeConfig?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{place.name}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{place.address}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-safe font-medium">
                        <Navigation className="w-3 h-3" />
                        {place.distance < 1 ? `${Math.round(place.distance * 1000)}m` : `${place.distance.toFixed(1)}km`} away
                      </span>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => openNavigation(place)}
                    className="rounded-xl gap-1.5 shrink-0 bg-primary/10 text-primary hover:bg-primary/20 border-0 shadow-none">
                    <Navigation className="w-3.5 h-3.5" /> Go
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}