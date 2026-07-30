import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Video, LogOut, ShieldCheck, Menu, Briefcase, CalendarCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";

const NAV = [
    { to: "/admin",             icon: LayoutDashboard, label: "Dashboard"     },
    { to: "/admin/employees",   icon: Briefcase,        label: "Employees"     },
    { to: "/admin/attendance",  icon: CalendarCheck,    label: "Attendance"    },
    { to: "/dashboard/join",    icon: Video,            label: "Live Meetings" },
];

function NavItem({ to, icon: Icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            end
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                        ? "bg-white/10 text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                )
            }
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </NavLink>
    );
}

export default function AdminShell({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { logout(); navigate("/login"); };

    const sidebar = (
        <div className="flex flex-col h-full">
            <div className="px-4 py-5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-md bg-white/10 flex items-center justify-center">
                        <ShieldCheck className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white leading-none">MeetMind</p>
                        <p className="text-xs text-slate-400 mt-0.5">Admin Console</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5">
                {NAV.map((item) => (
                    <NavItem key={item.to} {...item} onClick={() => setMobileOpen(false)} />
                ))}
            </nav>

            <div className="px-3 py-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                    <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-semibold text-white shrink-0">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    Sign out
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* desktop sidebar */}
            <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-slate-900 fixed inset-y-0 left-0">
                {sidebar}
            </aside>

            {/* mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
                    <aside className="relative z-10 w-56 h-full bg-slate-900">
                        {sidebar}
                    </aside>
                </div>
            )}

            <div className="flex-1 lg:pl-56 flex flex-col min-h-screen">
                {/* mobile topbar */}
                <header className="lg:hidden sticky top-0 z-30 bg-slate-900 h-12 flex items-center px-4 gap-3">
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="text-slate-400 hover:text-white"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <span className="text-sm font-semibold text-white">MeetMind Admin</span>
                </header>

                <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
