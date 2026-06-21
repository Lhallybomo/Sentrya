import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PullToRefreshIndicator({ pullY, refreshing }) {
  const visible = pullY > 0 || refreshing;
  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-center w-full overflow-hidden transition-all duration-150"
      style={{ height: pullY || (refreshing ? 40 : 0) }}
    >
      <div className={cn(
        "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center",
        refreshing && "bg-primary/20"
      )}>
        <RefreshCw className={cn(
          "w-4 h-4 text-primary transition-transform",
          refreshing && "animate-spin"
        )} />
      </div>
    </div>
  );
}