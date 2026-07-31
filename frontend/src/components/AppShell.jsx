import { LayoutDashboard, FileText, CheckSquare, BarChart2, Video, Film } from "lucide-react";
import EmployeeAppLayout from "./EmployeeAppLayout";

const NAV = [
    { to: "/dashboard",       icon: LayoutDashboard, label: "Dashboard",     exact: true },
    { to: "/dashboard/notes", icon: FileText,         label: "Meeting Notes"              },
    { to: "/dashboard/tasks",     icon: CheckSquare,  label: "Tasks"                      },
    { to: "/dashboard/analytics", icon: BarChart2,    label: "Analytics"                  },
    { to: "/dashboard/join",      icon: Video,        label: "Live Meeting"               },
    { to: "/dashboard/recordings", icon: Film,        label: "Recordings"                 },
];

export default function AppShell({ children }) {
    return (
        <EmployeeAppLayout nav={NAV} brand="MeetMind">
            {children}
        </EmployeeAppLayout>
    );
}
