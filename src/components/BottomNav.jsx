import { useLocation } from "react-router-dom";
import { Map, AlertTriangle, Car, Plane, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useTabNavigator, getTabRoot } from "@/hooks/useTabNavigator.js";

const navItems = [
  { root: "/",          icon: Map,          label: "Map"       },
  { root: "/incidents", icon: AlertTriangle, label: "Incidents" },
  { root: "/rides",     icon: Car,           label: "Rides"     },
  { root: "/travel",    icon: Plane,         label: "Travel"    },
  { root: "/alerts",    icon: Bell,          label: "Alerts"    },
  { root: "/profile",   icon: User,          label: "Profile"   },
];

export default function BottomNav() {
  const location = useLocation();
  const { handleTabPress } = useTabNavigator();
  const currentTabRoot = getTabRoot(location.pathname);

  return (
    <nav
      role="tablist"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-xl border-t border-border safe-area-bottom-pad"
    >
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map(({ root, icon: Icon, label }) => {
          const isActive = currentTabRoot === root;
          return (
            <button
              key={root}
              role="tab"
              aria-selected={isActive}
              aria-label={label}
              onClick={() => handleTabPress(root)}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors",
                "min-w-[52px] min-h-[44px]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} aria-hidden="true" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}