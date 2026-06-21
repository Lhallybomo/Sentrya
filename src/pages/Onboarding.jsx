import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Plane, Car, Hotel, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    icon: Shield,
    iconColor: "text-emerald-400",
    bgColor: "from-emerald-500/20 to-emerald-500/5",
    title: "Safety Intelligence",
    description: "Know the safest routes before you travel. Get real-time safety scores and verified incident alerts across Nigeria.",
  },
  {
    icon: Plane,
    iconColor: "text-blue-400",
    bgColor: "from-blue-500/20 to-blue-500/5",
    title: "Multi-Modal Travel",
    description: "Compare road, air, train, and sea travel options. SENTRYA scores each route for risk before you move.",
  },
  {
    icon: Car,
    iconColor: "text-purple-400",
    bgColor: "from-purple-500/20 to-purple-500/5",
    title: "Verified Mobility",
    description: "Book rides with screened, approved drivers in Lagos, Abuja, and Port Harcourt. Trust-first, safety-always.",
  },
  {
    icon: Hotel,
    iconColor: "text-amber-400",
    bgColor: "from-amber-500/20 to-amber-500/5",
    title: "Safe Stays",
    description: "Find safety-rated, verified accommodations wherever you go. SENTRYA vets every listing for your peace of mind.",
  },
];

export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else onComplete();
  };

  const slide = slides[current];
  const Icon = slide.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: "linear-gradient(135deg, #1a1a3e 0%, #2d1b69 40%, #4a1a8a 70%, #1a1a3e 100%)"
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className={`w-28 h-28 rounded-3xl bg-gradient-to-br ${slide.bgColor} flex items-center justify-center mb-10 backdrop-blur-sm border border-white/10`}>
              <Icon className={`w-14 h-14 ${slide.iconColor}`} />
            </div>

            <h2 className="text-3xl font-bold text-white mb-4">{slide.title}</h2>
            <p className="text-white/60 text-base leading-relaxed max-w-xs">{slide.description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12">
        <div className="flex items-center justify-center gap-2 mb-8">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === current ? 32 : 8,
                backgroundColor: i === current ? "#fff" : "rgba(255,255,255,0.3)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={onComplete}
            className="flex-1 text-white/50 hover:text-white hover:bg-white/10"
          >
            Skip
          </Button>
          <Button
            onClick={next}
            className="flex-1 bg-white text-purple-900 hover:bg-white/90 font-semibold rounded-xl h-12"
          >
            {current === slides.length - 1 ? "Get Started" : "Next"}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}