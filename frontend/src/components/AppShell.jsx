import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, FileText, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const NAV = [
    { to: "/dashboard",       icon: LayoutDashboard, label: "Dashboard",     exact: true },
    { to: "/dashboard/notes", icon: FileText,         label: "Meeting Notes"              },
];

function NavItem({ to, icon: Icon, label, exact, onClick }) {
    return (
        <NavLink
            to={to}
            end={exact}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )
            }
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </NavLink>
    );
}

export default function AppShell({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { logout(); navigate("/login"); };
    const closeMobile = () => setMobileOpen(false);

    const sidebar = (
        <div className="flex flex-col h-full">
            <div className="px-4 h-14 flex items-center border-b border-border shrink-0">
                <span className="text-base font-bold tracking-tight">MeetMind</span>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {NAV.map((item) => (
                    <NavItem key={item.to} {...item} onClick={closeMobile} />
                ))}
            </nav>

            <div className="px-3 py-4 border-t border-border shrink-0">
                <div className="flex items-center gap-2.5 mb-3 px-1">
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
                        {user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{user?.email}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive px-2"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" /> Sign out
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-muted/20">
            {/* Desktop sidebar */}
            <aside className="hidden md:flex flex-col w-56 shrink-0 fixed inset-y-0 left-0 bg-white border-r border-border z-30">
                {sidebar}
            </aside>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40 flex">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={closeMobile}
                    />
                    <aside className="relative w-56 bg-white flex flex-col shadow-xl z-50">
                        {sidebar}
                    </aside>
                </div>
            )}

            {/* Mobile topbar */}
            <div className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-white border-b border-border flex items-center px-4 gap-3">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <span className="text-base font-bold tracking-tight">MeetMind</span>
                {mobileOpen && (
                    <button onClick={closeMobile} className="ml-auto">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 md:ml-56 min-w-0">
                <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pt-[calc(3.5rem+2rem)] md:pt-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
