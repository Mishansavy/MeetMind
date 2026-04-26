import { useNavigate } from "react-router-dom";
import { LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

export default function AppShell({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const isAdmin = user?.role === "admin";

    return (
        <div className="min-h-screen bg-muted/20">
            <header className="sticky top-0 z-30 bg-background border-b border-border">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-base font-bold tracking-tight">MeetMind</span>
                        {isAdmin && (
                            <Badge variant="secondary" className="gap-1">
                                <ShieldCheck className="h-3 w-3" /> Admin
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="hidden sm:block text-sm text-muted-foreground">
                            {user?.name}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-muted-foreground"
                            onClick={() => { logout(); navigate("/login"); }}
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">Sign out</span>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                {children}
            </main>
        </div>
    );
}
