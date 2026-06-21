import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, Navigation2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function LocationSearch({ placeholder, value, onChange, icon = "pickup", className = "" }) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleInput(val) {
    setQuery(val);
    onChange(val);
    clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 400);
  }

  async function fetchSuggestions(q) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + " Nigeria")}&format=json&limit=5&countrycodes=ng`
      );
      const data = await res.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {}
    setLoading(false);
  }

  function selectSuggestion(place) {
    const label = place.display_name.split(",").slice(0, 3).join(", ");
    setQuery(label);
    onChange(label, { lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
    setSuggestions([]);
    setOpen(false);
  }

  async function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          const label = data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setQuery(label);
          onChange(label, { lat, lng });
        } catch {
          const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
          setQuery(label);
          onChange(label, { lat, lng });
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
  }

  const IconComp = icon === "pickup" ? MapPin : Navigation2;
  const iconColor = icon === "pickup" ? "text-safe" : "text-danger";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <IconComp className={cn("absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 shrink-0", iconColor)} />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          className="rounded-xl pl-10 pr-16"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query && (
            <button onClick={() => { setQuery(""); onChange(""); setSuggestions([]); setOpen(false); }}
              className="p-1 rounded-full hover:bg-muted">
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
          {icon === "pickup" && (
            <button onClick={useMyLocation} disabled={locating}
              className="p-1 rounded-full hover:bg-primary/10 text-primary" title="Use my location">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation2 className="w-4 h-4" />}
            </button>
          )}
          {loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((place) => (
            <button
              key={place.place_id}
              onMouseDown={() => selectSuggestion(place)}
              className="w-full text-left px-4 py-2.5 hover:bg-muted flex items-start gap-2 border-b border-border/50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-xs text-foreground leading-tight">
                {place.display_name.split(",").slice(0, 4).join(", ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}