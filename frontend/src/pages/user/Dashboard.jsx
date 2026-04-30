import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, CheckSquare, BarChart2, Video, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";
import AppShell from "../../components/AppShell";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

function StatCard({ label, value, icon: Icon, color, sub }) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                </div>
                <p className="text-3xl font-bold leading-none tabular-nums">{value}</p>
                {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
            </CardContent>
        </Card>
    );
}

function QuickAction({ icon: Icon, title, description, to, color }) {
    return (
        <Link to={to} className="group block">
            <Card className="hover:shadow-md transition-all duration-150 group-hover:-translate-y-0.5 h-full">
                <CardContent className="p-5 flex flex-col gap-3 h-full">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${color}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Open <ArrowRight className="h-3 w-3" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}


export default function UserDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);

    useEffect(() => {
        authApi.stats()
            .then((r) => setStats(r.data))
            .catch(() => setStats({ meetings: 0, tasks_pending: 0 }));
    }, []);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

    return (
        <AppShell>
            <div className="mb-8">
                <h1 className="text-2xl font-bold">
                    {greeting}, {user?.name?.split(" ")[0]}.
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Here's what's happening with your meetings.
                </p>
            </div>

            <div className="space-y-8 animate-fade-in">
                {/* Stat row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        label="Meeting Notes"
                        value={stats ? stats.meetings : "—"}
                        icon={FileText}
                        color="bg-violet-50 text-violet-600"
                        sub={stats?.meetings === 1 ? "1 note saved" : stats ? `${stats.meetings} notes saved` : null}
                    />
                    <StatCard
                        label="Tasks Pending"
                        value={stats ? stats.tasks_pending : "—"}
                        icon={CheckSquare}
                        color="bg-amber-50 text-amber-600"
                        sub={stats?.tasks_pending === 0 ? "All caught up" : null}
                    />
                    <StatCard
                        label="Meetings This Week"
                        value="—"
                        icon={TrendingUp}
                        color="bg-blue-50 text-blue-600"
                        sub="View trends in analytics"
                    />
                </div>

                {/* Quick access */}
                <div>
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick access</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <QuickAction
                            icon={FileText}
                            title="Meeting Notes"
                            description="Create, browse, and manage your meeting notes. Paste text or upload a PDF."
                            to="/dashboard/notes"
                            color="bg-violet-50 text-violet-600"
                        />
                        <QuickAction
                            icon={CheckSquare}
                            title="Tasks"
                            description="Track action items from your notes. Set assignees, deadlines, and priorities."
                            to="/dashboard/tasks"
                            color="bg-amber-50 text-amber-600"
                        />
                        <QuickAction
                            icon={BarChart2}
                            title="Analytics"
                            description="Notes per week, task completion trends, and workload at a glance."
                            to="/dashboard/analytics"
                            color="bg-blue-50 text-blue-600"
                        />
                        <QuickAction
                            icon={Video}
                            title="Live Meeting"
                            description="Start or join a WebRTC meeting room. Share your screen and video."
                            to="/dashboard/join"
                            color="bg-emerald-50 text-emerald-600"
                        />
                    </div>
                </div>

                {/* CTA strip */}
                {stats?.meetings === 0 && (
                    <Card className="border-dashed">
                        <CardContent className="p-6 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-sm font-semibold">No notes yet</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Add your first meeting note to get started.
                                </p>
                            </div>
                            <Button size="sm" asChild>
                                <Link to="/dashboard/notes">Add a note</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppShell>
    );
}
