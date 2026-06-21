import { useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const TAB_ROOTS = ["/", "/incidents", "/rides", "/travel", "/alerts", "/profile"];

export function getTabRoot(pathname) {
  if (TAB_ROOTS.includes(pathname)) return pathname;
  const sorted = [...TAB_ROOTS].filter(r => r !== "/").sort((a, b) => b.length - a.length);
  for (const root of sorted) {
    if (pathname.startsWith(root + "/") || pathname.startsWith(root)) return root;
  }
  return "/";
}

export function useTabNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  const stacks = useRef(
    Object.fromEntries(TAB_ROOTS.map(r => [r, [r]]))
  );

  const currentTabRoot = getTabRoot(location.pathname);

  const handleTabPress = useCallback((tabRoot) => {
    if (tabRoot === currentTabRoot) {
      stacks.current[tabRoot] = [tabRoot];
      navigate(tabRoot, { replace: true });
    } else {
      const stack = stacks.current[tabRoot];
      const dest = stack[stack.length - 1] || tabRoot;
      navigate(dest);
    }
  }, [currentTabRoot, navigate]);

  return { handleTabPress, currentTabRoot, stacks };
}