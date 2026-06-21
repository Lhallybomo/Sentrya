import { ExternalLink, Plane, Train, Ship } from "lucide-react";
import { motion } from "framer-motion";

const BOOKING_SOURCES = {
  flight: [
    { name: "Overland Airways", url: "https://www.overlandairways.com", note: "Domestic flights across Nigeria" },
    { name: "Air Peace", url: "https://www.flyairpeace.com", note: "Nigeria's largest carrier" },
    { name: "Ibom Air", url: "https://www.ibomair.com", note: "Budget domestic flights" },
    { name: "United Nigeria Airlines", url: "https://www.flyunitednigeria.com", note: "Affordable domestic routes" },
    { name: "Wakanow Flights", url: "https://www.wakanow.com/en-NG/flights", note: "Compare & book all airlines" },
  ],
  train: [
    { name: "NRC Booking (Official)", url: "https://www.nrc.gov.ng", note: "Nigerian Railway Corporation tickets" },
    { name: "Train Express", url: "https://trainexpress.com.ng", note: "Lagos–Ibadan online booking" },
    { name: "Wakanow Trains", url: "https://www.wakanow.com", note: "Multi-modal booking platform" },
  ],
  sea: [
    { name: "NIMASA Ferry (Official)", url: "https://www.nimasa.gov.ng", note: "Nigerian Maritime Administration" },
    { name: "Stena Line Nigeria", url: "https://www.stenaline.com", note: "Ferry & sea travel booking" },
    { name: "ABC Transport Waterway", url: "https://www.abctransport.com", note: "Waterway transport services" },
    { name: "Lagos Ferry Services", url: "https://www.lagosferryservices.com", note: "Lagos water bus & ferry" },
  ],
};

const config = {
  flight: { label: "Book a Flight", icon: Plane, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900" },
  train: { label: "Book a Train Ticket", icon: Train, color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
  sea: { label: "Book a Sea Ticket", icon: Ship, color: "text-cyan-500", bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-200 dark:border-cyan-900" },
};

export default function BookingLinks({ mode }) {
  const { label, icon: Icon, color, bg, border } = config[mode];
  const sources = BOOKING_SOURCES[mode];

  return (
    <div className="space-y-3">
      <div className={`rounded-2xl border p-4 ${bg} ${border}`}>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${color}`} />
          <h3 className="font-semibold text-sm">{label}</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Select a provider below to be redirected to their booking platform.
        </p>
        <div className="space-y-2">
          {sources.map((src, i) => (
            <motion.a
              key={src.url}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{src.name}</p>
                <p className="text-xs text-muted-foreground truncate">{src.note}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}