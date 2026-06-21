import { Link } from "react-router-dom";
import { Plane, Train, Bus, Ship, ChevronRight, ExternalLink } from "lucide-react";

const TRAVEL_OPTIONS = [
  {
    icon: Plane,
    label: "Flights",
    desc: "Domestic & international",
    color: "text-primary bg-primary/10",
    to: "/travel?mode=flight",
  },
  {
    icon: Train,
    label: "Rail",
    desc: "NRC train booking",
    color: "text-safe bg-safe/10",
    to: "/travel?mode=rail",
  },
  {
    icon: Bus,
    label: "Road Transport",
    desc: "Inter-state buses",
    color: "text-caution bg-caution/10",
    to: "/travel?mode=road",
  },
  {
    icon: Ship,
    label: "Sea / Ferry",
    desc: "Waterway transport",
    color: "text-chart-5 bg-chart-5/10",
    to: "/travel?mode=sea",
  },
];

const QUICK_LINKS = [
  { label: "Book NRC Train", url: "https://www.nrc.gov.ng", flag: "🚂" },
  { label: "Air Peace Flights", url: "https://www.flyairpeace.com", flag: "✈️" },
  { label: "Wakanow", url: "https://www.wakanow.com", flag: "🌍" },
  { label: "Travelstart NG", url: "https://www.travelstart.com.ng", flag: "🎫" },
];

export default function TravelSection() {
  return (
    <section className="px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-chart-5/10 flex items-center justify-center">
            <Plane className="w-4 h-4 text-chart-5" />
          </div>
          <div>
            <h2 className="text-base font-bold">Travel</h2>
            <p className="text-[10px] text-muted-foreground">Book flights, trains & more</p>
          </div>
        </div>
        <Link to="/travel" className="flex items-center gap-1 text-xs text-primary font-medium">
          Explore <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {TRAVEL_OPTIONS.map(({ icon: Icon, label, desc, color, to }) => (
          <Link key={label} to={to}>
            <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2.5 ${color}`}>
                <Icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-sm font-semibold">{label}</p>
              <p className="text-[10px] text-muted-foreground">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick booking links */}
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">Quick Booking</p>
      <div className="space-y-2">
        {QUICK_LINKS.map(({ label, url, flag }) => (
          <a key={label} href={url} target="_blank" rel="noreferrer">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 hover:border-primary/40 transition-colors">
              <span className="text-xl">{flag}</span>
              <span className="flex-1 text-sm font-medium">{label}</span>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}