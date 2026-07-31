import { LayoutDashboard, Video, Briefcase, CalendarCheck, Film } from "lucide-react";
import AdminAppLayout from "./AdminAppLayout";

const NAV = [
    { to: "/admin",             icon: LayoutDashboard, label: "Dashboard"     },
    { to: "/admin/employees",   icon: Briefcase,        label: "Employees"     },
    { to: "/admin/attendance",  icon: CalendarCheck,    label: "Attendance"    },
    { to: "/admin/recordings",  icon: Film,             label: "Recordings"    },
    { to: "/dashboard/join",    icon: Video,            label: "Live Meetings" },
];

export default function AdminShell({ children }) {
    return (
        <AdminAppLayout nav={NAV} brand="MeetMind" subtitle="Admin Console">
            {children}
        </AdminAppLayout>
    );
}
