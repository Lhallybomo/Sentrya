import { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import moment from "moment";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-safe font-bold">₦{(payload[0]?.value || 0).toLocaleString()}</p>
    </div>
  );
}

export default function EarningsChart({ rides }) {
  const completed = rides.filter((r) => r.status === "completed");

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const day = moment().subtract(i, "days");
      const dayRides = completed.filter((r) => moment(r.created_date).isSame(day, "day"));
      days.push({
        label: day.format("ddd"),
        earnings: dayRides.reduce((sum, r) => sum + (r.fare_estimate || 0), 0),
        trips: dayRides.length,
      });
    }
    return days;
  }, [completed]);

  const monthlyData = useMemo(() => {
    const weeks = [];
    for (let i = 3; i >= 0; i--) {
      const start = moment().subtract(i, "weeks").startOf("week");
      const end = moment().subtract(i, "weeks").endOf("week");
      const weekRides = completed.filter((r) => moment(r.created_date).isBetween(start, end));
      weeks.push({
        label: `Wk ${4 - i}`,
        earnings: weekRides.reduce((sum, r) => sum + (r.fare_estimate || 0), 0),
      });
    }
    return weeks;
  }, [completed]);

  const thisWeekEarnings = weeklyData.reduce((s, d) => s + d.earnings, 0);
  const lastWeekStart = moment().subtract(2, "weeks").startOf("week");
  const lastWeekEnd = moment().subtract(1, "weeks").startOf("week");
  const lastWeekEarnings = completed
    .filter((r) => moment(r.created_date).isBetween(lastWeekStart, lastWeekEnd))
    .reduce((sum, r) => sum + (r.fare_estimate || 0), 0);
  const growth = lastWeekEarnings > 0 ? ((thisWeekEarnings - lastWeekEarnings) / lastWeekEarnings) * 100 : 0;
  const growing = growth >= 0;

  return (
    <div className="space-y-4">
      {/* Growth indicator */}
      <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4">
        <div>
          <p className="text-xs text-muted-foreground">This Week</p>
          <p className="text-xl font-bold">₦{thisWeekEarnings.toLocaleString()}</p>
        </div>
        <div className={cn("flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-semibold",
          growing ? "bg-safe/10 text-safe" : "bg-danger/10 text-danger")}>
          {growing ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(growth).toFixed(1)}%
        </div>
      </div>

      {/* Daily earnings bar chart */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Daily Earnings (₦)</p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="earnings" fill="hsl(var(--safe))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly trend line */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-3">Monthly Trend (₦)</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily trip counts */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Daily Trips This Week</p>
        <div className="grid grid-cols-7 gap-1">
          {weeklyData.map((d) => (
            <div key={d.label} className="text-center">
              <div className={cn(
                "w-full rounded-lg py-1 text-[10px] font-bold mb-1",
                d.trips > 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>{d.trips}</div>
              <p className="text-[9px] text-muted-foreground">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}