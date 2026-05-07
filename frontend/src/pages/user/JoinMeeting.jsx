import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ArrowRight, Hash } from "lucide-react";
import { roomsApi } from "../../api/rooms";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/AppShell";
import AdminShell from "../../components/AdminShell";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

export default function JoinMeeting() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [code, setCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    const handleCreate = async () => {
        setCreating(true);
        setError("");
        try {
            const res = await roomsApi.create();
            navigate(`/dashboard/room?code=${res.data.room_code}`);
        } catch {
            setError("Could not create a room. Try again.");
        } finally {
            setCreating(false);
        }
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) return;
        navigate(`/dashboard/room?code=${trimmed}`);
    };

    const Shell = isAdmin ? AdminShell : AppShell;

    return (
        <Shell>
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-0.5">
                    <Video className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Live Meetings</h1>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                    {isAdmin ? "Start a new room or join one with a code." : "Enter a room code to join a meeting."}
                </p>
            </div>

            {error && <p className="text-sm text-destructive mb-4">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
                {isAdmin && (
                    <Card>
                        <CardContent className="p-6 flex flex-col gap-4">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Video className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">New meeting</p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    Create a room and share the code with members.
                                </p>
                            </div>
                            <Button size="sm" className="gap-1.5 w-full" onClick={handleCreate} disabled={creating}>
                                {creating ? "Creating…" : <><ArrowRight className="h-4 w-4" /> Start meeting</>}
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardContent className="p-6 flex flex-col gap-4">
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <Hash className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Join with code</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                Enter the room code shared by your admin.
                            </p>
                        </div>
                        <form onSubmit={handleJoin} className="flex flex-col gap-2">
                            <Input
                                placeholder="Room code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                className="gap-1.5 w-full"
                                disabled={!code.trim()}
                            >
                                Join
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </Shell>
    );
}
