import { CalendarDays, FileText, Video, CheckCircle, LayoutDashboard } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
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
        description: "Task management and deadlines coming in the next sprint.",
        color: "bg-blue-50 text-blue-600",
    },
    {
        icon: FileText,
        title: "Meeting Notes",
        description: "AI-generated transcripts and summaries will appear here.",
        color: "bg-violet-50 text-violet-600",
    },
    {
        icon: Video,
        title: "Join a Meeting",
        description: "Live WebRTC meeting sessions are coming soon.",
        color: "bg-emerald-50 text-emerald-600",
    },
];

export default function UserDashboard() {
    const { user } = useAuth();

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
                    <StatCard label="Meetings this week" value="—" icon={CalendarDays} color="bg-blue-50 text-blue-600" />
                    <StatCard label="Notes saved" value="—" icon={FileText} color="bg-violet-50 text-violet-600" />
                    <StatCard label="Tasks pending" value="—" icon={CheckCircle} color="bg-amber-50 text-amber-600" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {FEATURE_CARDS.map(({ icon: Icon, title, description, color }) => (
                        <Card key={title} className="hover:shadow-md transition-shadow cursor-default">
                            <CardHeader className="pb-2">
                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-2 ${color}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <CardTitle className="text-sm">{title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>{description}</CardDescription>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppShell>
    );
}
