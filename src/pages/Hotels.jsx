import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Hotel, MapPin, Star, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { NIGERIAN_STATES } from "@/lib/nigeriaData";
import { motion } from "framer-motion";

const safetyBadge = {
  safe: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
  caution: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  danger: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const priceLabels = {
  "budget": "₦5,000 – ₦15,000",
  "mid-range": "₦15,000 – ₦50,000",
  "luxury": "₦50,000+",
};

export default function Hotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadHotels();
  }, [filterState]);

  async function loadHotels() {
    setLoading(true);
    let data;
    if (filterState && filterState !== "all") {
      data = await base44.entities.Hotel.filter({ state: filterState }, "-rating", 50);
    } else {
      data = await base44.entities.Hotel.list("-rating", 50);
    }
    setHotels(data);
    setLoading(false);
  }

  const filtered = hotels.filter((h) =>
    !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border px-4 pt-4 pb-3 space-y-3">
        <h1 className="text-xl font-bold">Accommodation</h1>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search hotels..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl pl-10"
          />
        </div>

        <Select value={filterState} onValueChange={setFilterState}>
          <SelectTrigger className="rounded-xl h-9 text-sm">
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
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Hotel className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No hotels found</p>
          </div>
        ) : (
          filtered.map((hotel, i) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card overflow-hidden"
            >
              {hotel.image_url && (
                <img src={hotel.image_url} alt={hotel.name} className="w-full h-40 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{hotel.name}</h3>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", safetyBadge[hotel.safety_rating])}>
                    {hotel.safety_rating?.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <MapPin className="w-3 h-3" />
                  {hotel.city}, {hotel.state}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    {priceLabels[hotel.price_range] || hotel.price_range}
                  </span>
                  {hotel.rating && (
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {hotel.rating}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}