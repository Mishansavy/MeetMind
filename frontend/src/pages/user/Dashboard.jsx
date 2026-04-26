import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, FileText, Video, CheckCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";
import AppShell from "../../components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <Card>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold leading-none">{value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

const FEATURE_CARDS = [
    {
        icon: CalendarDays,
        title: "My Tasks",
        description: "Task management coming soon.",
        color: "bg-blue-50 text-blue-600",
        to: null,
    },
    {
        icon: FileText,
        title: "Meeting Notes",
        description: "Create and manage your meeting notes.",
        color: "bg-violet-50 text-violet-600",
        to: "/dashboard/notes",
    },
    {
        icon: Video,
        title: "Join a Meeting",
        description: "Live WebRTC meeting sessions are coming soon.",
        color: "bg-emerald-50 text-emerald-600",
        to: null,
    },
];

export default function UserDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({ meetings: "—", tasks_pending: "—" });

    useEffect(() => {
        authApi.stats()
            .then((r) => setStats(r.data))
            .catch(() => {});
    }, []);

    return (
        <AppShell>
            <div className="mb-7">
                <div className="flex items-center gap-2 mb-1">
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">
                        Welcome back, {user?.name?.split(" ")[0]}
                    </h1>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                    Your meeting intelligence hub.
                </p>
            </div>

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Notes saved" value={stats.meetings} icon={FileText} color="bg-violet-50 text-violet-600" />
                    <StatCard label="Tasks pending" value={stats.tasks_pending} icon={CheckCircle} color="bg-amber-50 text-amber-600" />
                    <StatCard label="Meetings this week" value="—" icon={CalendarDays} color="bg-blue-50 text-blue-600" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {FEATURE_CARDS.map(({ icon: Icon, title, description, color, to }) => {
                        const inner = (
                            <>
                                <CardHeader className="pb-2">
                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <CardTitle className="text-sm">{title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription>{description}</CardDescription>
                                </CardContent>
                            </>
                        );

                        return to ? (
                            <Link key={title} to={to} className="block">
                                <Card className="hover:shadow-md transition-shadow h-full">{inner}</Card>
                            </Link>
                        ) : (
                            <Card key={title} className="hover:shadow-md transition-shadow cursor-default opacity-60">
                                {inner}
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppShell>
    );
}
