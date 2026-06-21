import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "./BottomNav.jsx";
import TabNavigationTracker from "./TabNavigationTracker.jsx";
import { useTabNavigator } from "@/hooks/useTabNavigator.js";

const pageVariants = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -12 },
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.18,
};

export default function Layout() {
  const { stacks } = useTabNavigator();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <TabNavigationTracker stacks={stacks} />
      <main className="pb-20 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.key}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={pageTransition}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
    </div>
  );
}