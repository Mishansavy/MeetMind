import { Card, CardContent } from "./ui/card";
import { cn } from "../lib/utils";

const TONES = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
};

export function StatCard({ label, value, icon: Icon, tone = "primary", sub, className }) {
  return (
    <Card className={cn("relative overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200", className)}>
      <div
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 opacity-[0.35]"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border)) 1.5px, transparent 1.5px)",
          backgroundSize: "10px 10px",
          maskImage: "radial-gradient(circle at top right, black, transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/[0.04]" />

      <CardContent className="relative p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          {Icon && (
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", TONES[tone])}>
              <Icon className="h-[18px] w-[18px]" />
            </div>
          )}
        </div>
        <p className="text-4xl font-bold leading-none tabular-nums">{value}</p>
        {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function MetricGrid({ children, className }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>{children}</div>;
}
