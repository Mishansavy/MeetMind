import { useEffect, useState } from "react";
import { Film, Play, Download, X } from "lucide-react";
import { roomsApi } from "../../api/rooms";
import AppShell from "../../components/AppShell";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";

function fmtSize(bytes) {
    if (!bytes) return "0 MB";
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

export default function Recordings() {
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playback, setPlayback] = useState(null);

    useEffect(() => {
        roomsApi.myRecordings()
            .then((r) => setRecordings(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const play = async (id) => {
        const { data } = await roomsApi.downloadRecording(id);
        setPlayback(URL.createObjectURL(data));
    };

    const closePlayback = () => {
        if (playback) URL.revokeObjectURL(playback);
        setPlayback(null);
    };

    const download = async (recording) => {
        const { data } = await roomsApi.downloadRecording(recording.id);
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${recording.room_code}.webm`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AppShell>
            <PageHeader
                icon={Film}
                title="Recordings"
                description={`${recordings.length} recording${recordings.length === 1 ? "" : "s"} from your meetings`}
            />

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-3 p-5">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : recordings.length === 0 ? (
                        <EmptyState
                            icon={Film}
                            title="No recordings yet"
                            description="Recordings you save during a live meeting will appear here."
                        />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Meeting</TableHead>
                                    <TableHead>Room code</TableHead>
                                    <TableHead>Recorded</TableHead>
                                    <TableHead>Size</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recordings.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell className="font-medium">{r.room_title || "Untitled meeting"}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{r.room_code}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{fmtSize(r.size_bytes)}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => play(r.id)}>
                                                    <Play className="h-3 w-3" /> Play
                                                </Button>
                                                <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => download(r)}>
                                                    <Download className="h-3 w-3" /> Download
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {playback && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={closePlayback}>
                    <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
                        <video src={playback} controls autoPlay className="w-full rounded-lg" />
                        <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={closePlayback}>
                            <X className="h-3.5 w-3.5" /> Close
                        </Button>
                    </div>
                </div>
            )}
        </AppShell>
    );
}
