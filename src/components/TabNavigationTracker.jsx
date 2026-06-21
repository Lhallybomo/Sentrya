import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getTabRoot } from "@/hooks/useTabNavigator.js";

export default function TabNavigationTracker({ stacks }) {
  const location = useLocation();

  useEffect(() => {
    const tabRoot = getTabRoot(location.pathname);
    const stack = stacks.current[tabRoot];
    if (stack[stack.length - 1] !== location.pathname) {
      stacks.current[tabRoot] = [...stack, location.pathname];
    }
  }, [location.pathname, stacks]);

  return null;
}