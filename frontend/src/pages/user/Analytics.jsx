import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { analyticsApi } from "../../api/analytics";
import AppShell from "../../components/AppShell";
import { Card, CardContent } from "../../components/ui/card";

function ChartSkeleton() {
    return <div className="h-48 rounded-md bg-muted animate-pulse" />;
}

function Section({ title, subtitle, children }) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="mb-4">
                    <p className="text-sm font-semibold">{title}</p>
                    {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
                </div>
                {children}
            </CardContent>
        </Card>
    );
}

const TOOLTIP_STYLE = {
    contentStyle: { fontSize: 12, borderRadius: 6, border: "1px solid hsl(220 13% 91%)" },
    labelStyle: { fontWeight: 600 },
};

export default function Analytics() {
    const [weekly, setWeekly] = useState(null);
    const [completion, setCompletion] = useState(null);
    const [workload, setWorkload] = useState(null);

    useEffect(() => {
        analyticsApi.meetingsPerWeek().then((r) => setWeekly(r.data)).catch(() => setWeekly([]));
        analyticsApi.taskCompletion().then((r) => setCompletion(r.data)).catch(() => setCompletion([]));
        analyticsApi.workload().then((r) => setWorkload(r.data)).catch(() => setWorkload(null));
    }, []);

    const weeklyLabelled = (weekly || []).map((d) => ({
        ...d,
        label: new Date(d.week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    const completionLabelled = (completion || []).map((d) => ({
        ...d,
        label: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

    return (
        <AppShell>
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-0.5">
                    <BarChart2 className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Analytics</h1>
                </div>
                <p className="text-sm text-muted-foreground pl-7">Your activity over the past few weeks.</p>
            </div>

            <div className="space-y-4">
                {/* Summary strip */}
                {workload ? (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total tasks", value: workload.total },
                            { label: "Completed", value: workload.completed },
                            { label: "Pending", value: workload.pending },
                        ].map(({ label, value }) => (
                            <Card key={label}>
                                <CardContent className="p-4">
                                    <p className="text-2xl font-bold tabular-nums">{value}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                            <Card key={i}><CardContent className="p-4 h-16 animate-pulse bg-muted rounded" /></Card>
                        ))}
                    </div>
                )}

                <Section title="Meeting notes per week" subtitle="Last 8 weeks">
                    {weekly === null ? <ChartSkeleton /> : weekly.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={weeklyLabelled} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Bar dataKey="count" name="Notes" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Section>

                <Section title="Task activity" subtitle="Created vs completed, last 30 days">
                    {completion === null ? <ChartSkeleton /> : completion.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-10">No data yet</p>
                    ) : (
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={completionLabelled}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
                                <Tooltip {...TOOLTIP_STYLE} />
                                <Line type="monotone" dataKey="total" name="Created" stroke="hsl(221 83% 53%)" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="completed" name="Completed" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </Section>
            </div>
        </AppShell>
    );
}
