import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, Moon, Sun, ChevronDown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel,
} from "./ui/dropdown-menu";
import { cn } from "../lib/utils";
import { SourceLink } from "./SourceLink";

function NavItem({ to, icon: Icon, label, exact, onClick }) {
    return (
        <NavLink
            to={to}
            end={exact}
            onClick={onClick}
            className={({ isActive }) =>
                cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )
            }
        >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
        </NavLink>
    );
}

export default function EmployeeAppLayout({ nav, brand, subtitle, children }) {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => { logout(); navigate("/login"); };
    const closeMobile = () => setMobileOpen(false);

    const sidebarBg = "bg-card border-r border-border";
    const borderTone = "border-border";

    const sidebar = (
        <div className="relative flex h-full flex-col">
            <div className={cn("relative flex h-16 shrink-0 items-center gap-3 border-b px-4", borderTone)}>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <span className="text-sm font-bold text-primary">M</span>
                </div>
                <div>
                    <p className="text-sm font-semibold leading-none text-foreground">{brand}</p>
                    {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
                </div>
            </div>

            <nav className="relative flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {nav.map((item) => (
                    <NavItem key={item.to} {...item} onClick={closeMobile} />
                ))}
            </nav>

            <div className={cn("relative border-t px-3 py-3", borderTone)}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-muted/60">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback>
                                    {user?.name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium leading-none text-foreground">
                                    {user?.name}
                                </p>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel>Signed in as {user?.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={toggleTheme}>
                            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            {theme === "dark" ? "Light mode" : "Dark mode"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <SourceLink className="mt-1 text-muted-foreground hover:text-foreground" />
            </div>
        </div>
    );

    return (
        <div className="flex min-h-screen bg-muted/20">
            <aside className={cn("fixed inset-y-0 left-0 z-30 hidden w-64 shrink-0 flex-col lg:flex lg:w-[15%]", sidebarBg)}>
                {sidebar}
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-40 flex lg:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeMobile} />
                    <aside className={cn("relative z-50 flex w-64 flex-col shadow-xl", sidebarBg)}>
                        {sidebar}
                    </aside>
                </div>
            )}

            <div className={cn("fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b px-4 lg:hidden bg-card", borderTone)}>
                <button
                    onClick={() => setMobileOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 hover:bg-muted"
                >
                    <Menu className="h-5 w-5" />
                </button>
                <span className="text-base font-bold tracking-tight text-foreground">{brand}</span>
                {mobileOpen && (
                    <button onClick={closeMobile} className="ml-auto">
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="min-w-0 flex-1 lg:ml-[10%]">
                <main className="mx-auto max-w-6xl px-4 py-8 pt-[calc(3.5rem+2rem)] sm:px-6 lg:pt-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
