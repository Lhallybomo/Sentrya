import { useState, useEffect, useRef } from "react";

/**
 * Native-style pull-to-refresh hook.
 * @param {Function} onRefresh - async function to call on refresh
 * @param {Object} options
 * @param {number} options.threshold - px to pull before triggering (default 70)
 */
export function usePullToRefresh(onRefresh, { threshold = 70 } = {}) {
  const [pulling, setPulling] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current || document.documentElement;

    function onTouchStart(e) {
      const scrollTop = (containerRef.current || document.documentElement).scrollTop;
      if (scrollTop > 0) return;
      startY.current = e.touches[0].clientY;
    }

    function onTouchMove(e) {
      if (startY.current === null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0) {
        setPulling(true);
        setPullY(Math.min(dy * 0.5, threshold + 20));
        // Prevent native scroll rubber-band while pulling
        if (dy > 10) e.preventDefault();
      }
    }

    async function onTouchEnd() {
      if (!pulling) return;
      if (pullY >= threshold * 0.5) {
        setRefreshing(true);
        setPullY(40);
        await onRefresh();
        setRefreshing(false);
      }
      setPulling(false);
      setPullY(0);
      startY.current = null;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pulling, pullY, refreshing, onRefresh, threshold]);

  return { pulling, pullY, refreshing, containerRef };
}