import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Video, ArrowRight, Hash, Copy, Check, X, CalendarDays, Clock, Users } from "lucide-react";
import { roomsApi } from "../../api/rooms";
import { adminApi } from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/AppShell";
import AdminShell from "../../components/AdminShell";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import { cn } from "../../lib/utils";

function NewMeetingForm({ onCreated }) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [members, setMembers] = useState([]);
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        adminApi.getAllUsers().then((r) => {
            setMembers(r.data.filter((u) => u.role !== "admin" && u.is_approved));
        }).catch(() => {});
    }, []);

    const toggleEmail = (email) => {
        setSelectedEmails((prev) =>
            prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
        );
    };

    const isNow = !date && !time;

    const handleCreate = async () => {
        if (!title.trim()) { setError("Meeting title is required."); return; }
        setCreating(true);
        setError("");
        try {
            let scheduled_at = null;
            if (date) {
                const combined = time ? `${date}T${time}` : `${date}T09:00`;
                scheduled_at = new Date(combined).toISOString();
            }
            const res = await roomsApi.create({
                title: title.trim(),
                scheduled_at,
                invite_emails: selectedEmails,
            });
            onCreated(res.data, isNow);
        } catch {
            setError("Could not create room. Try again.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="max-w-lg space-y-6">
            <div className="space-y-1.5">
                <Label htmlFor="mtitle">Meeting title <span className="text-destructive">*</span></Label>
                <Input
                    id="mtitle"
                    placeholder="e.g. Weekly standup"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                        Date
                        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        Time
                        <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
            </div>

            {isNow ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    No date set, this meeting will start immediately when you create it.
                </p>
            ) : (
                <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                    Meeting will be scheduled. Invite emails will be sent on creation.
                </p>
            )}

            <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    Attendees
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>

                {members.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No approved members yet.</p>
                ) : (
                    <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto bg-background">
                        {members.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleEmail(m.email)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors",
                                    selectedEmails.includes(m.email)
                                        ? "bg-primary/5"
                                        : "hover:bg-muted/50"
                                )}
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="h-7 w-7 rounded-full bg-slate-100 border border-border flex items-center justify-center text-xs font-semibold shrink-0">
                                        {m.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium leading-none">{m.name}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{m.email}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                                    selectedEmails.includes(m.email)
                                        ? "bg-primary border-primary"
                                        : "border-border bg-background"
                                )}>
                                    {selectedEmails.includes(m.email) && (
                                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {selectedEmails.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {selectedEmails.map((e) => (
                            <Badge key={e} variant="secondary" className="gap-1 text-xs pr-1">
                                {e}
                                <button
                                    type="button"
                                    onClick={() => toggleEmail(e)}
                                    className="ml-0.5 rounded hover:bg-muted"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {error && (
                <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                </p>
            )}

            <Button onClick={handleCreate} disabled={creating} className="w-full sm:w-auto">
                {creating ? "Creating..." : isNow ? "Create & start now" : "Save meeting"}
                {!creating && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
        </div>
    );
}

function ShareScreen({ room, isNow, onGoToRoom, onCreateAnother }) {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(room.room_code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-md space-y-6">
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Room code</p>
                <p className="text-4xl font-mono font-bold tracking-[0.2em] mt-1">{room.room_code}</p>
                {room.title && (
                    <p className="text-sm font-medium text-foreground mt-2">{room.title}</p>
                )}
                {room.scheduled_at && (
                    <p className="text-xs text-muted-foreground">
                        {new Date(room.scheduled_at).toLocaleString("en-US", {
                            weekday: "long", month: "long", day: "numeric",
                            hour: "numeric", minute: "2-digit",
                        })}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2" onClick={copy}>
                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy room code"}
                </Button>

                {isNow && (
                    <Button className="w-full gap-2" onClick={onGoToRoom}>
                        <Video className="h-4 w-4" /> Join now
                    </Button>
                )}
            </div>

            <p className="text-xs text-center text-muted-foreground">
                {isNow
                    ? "Invite emails have been sent. Share the code above with anyone else, or join now."
                    : "Invite emails have been sent. Share the code above with anyone who wasn't invited by email."}
            </p>

            <div className="pt-2 border-t border-border">
                <button
                    type="button"
                    onClick={onCreateAnother}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Create another meeting
                </button>
            </div>
        </div>
    );
}

export default function JoinMeeting() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === "admin";

    const [code, setCode] = useState("");
    // Admin flow: "idle" | "new-meeting" | "share"
    const [view, setView] = useState("idle");
    const [createdRoom, setCreatedRoom] = useState(null);
    const [startNow, setStartNow] = useState(false);

    const handleCreated = (room, isNow) => {
        setCreatedRoom(room);
        setStartNow(isNow);
        setView("share");
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const trimmed = code.trim();
        if (!trimmed) return;
        navigate(`/dashboard/room?code=${trimmed}`);
    };

    const Shell = isAdmin ? AdminShell : AppShell;

    // New meeting form page
    if (isAdmin && view === "new-meeting") {
        return (
            <Shell>
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => setView("idle")}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 block"
                    >
                        ← Back
                    </button>
                    <h1 className="text-xl font-semibold">New meeting</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Set a title, optionally schedule a time, and invite attendees.
                    </p>
                </div>
                <NewMeetingForm onCreated={handleCreated} />
            </Shell>
        );
    }

    // Share screen page
    if (isAdmin && view === "share" && createdRoom) {
        return (
            <Shell>
                <div className="mb-8">
                    <h1 className="text-xl font-semibold">Meeting created</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Share the room code or join directly.
                    </p>
                </div>
                <ShareScreen
                    room={createdRoom}
                    isNow={startNow}
                    onGoToRoom={() => navigate(`/dashboard/room?code=${createdRoom.room_code}`)}
                    onCreateAnother={() => { setCreatedRoom(null); setView("new-meeting"); }}
                />
            </Shell>
        );
    }

    // Landing / join with code
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
                                    Set a title, schedule a time, and invite attendees.
                                </p>
                            </div>
                            <Button size="sm" className="gap-1.5 w-full" onClick={() => setView("new-meeting")}>
                                <ArrowRight className="h-4 w-4" /> Start meeting
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
