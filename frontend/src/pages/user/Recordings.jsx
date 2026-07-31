import { useEffect, useState } from "react";
import { Film, Play, Download, Share2, X, Users } from "lucide-react";
import { roomsApi } from "../../api/rooms";
import AppShell from "../../components/AppShell";
import { PageHeader } from "../../components/PageHeader";
import { EmptyState } from "../../components/EmptyState";
import { ShareRecordingDialog } from "../../components/ShareRecordingDialog";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";

function fmtSize(bytes) {
    if (!bytes) return "0 MB";
    return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

function fmtDate(iso) {
    return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Recordings() {
    const [recordings, setRecordings] = useState([]);
    const [shared, setShared] = useState([]);
    const [loading, setLoading] = useState(true);
    const [playback, setPlayback] = useState(null);
    const [shareTarget, setShareTarget] = useState(null);

    const load = () => {
        setLoading(true);
        Promise.all([
            roomsApi.myRecordings().then((r) => setRecordings(r.data)).catch(() => {}),
            roomsApi.sharedWithMe().then((r) => setShared(r.data)).catch(() => {}),
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const play = async (id) => {
        const { data } = await roomsApi.downloadRecording(id);
        setPlayback(URL.createObjectURL(data));
    };

    const closePlayback = () => {
        if (playback) URL.revokeObjectURL(playback);
        setPlayback(null);
    };

    const download = async (id, code) => {
        const { data } = await roomsApi.downloadRecording(id);
        const url = URL.createObjectURL(data);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${code}.webm`;
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
                    <Tabs defaultValue="mine">
                        <div className="px-4 pt-4 pb-0 border-b border-border">
                            <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none w-auto">
                                {[
                                    { value: "mine", label: "My Recordings", count: recordings.length },
                                    { value: "shared", label: "Shared with Me", count: shared.length },
                                ].map(({ value, label, count }) => (
                                    <TabsTrigger
                                        key={value}
                                        value={value}
                                        className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-0 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none text-muted-foreground"
                                    >
                                        {label}
                                        {count > 0 && (
                                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                                {count}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        <TabsContent value="mine" className="mt-0">
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
                                                <TableCell className="text-muted-foreground">{fmtDate(r.created_at)}</TableCell>
                                                <TableCell className="text-muted-foreground">{fmtSize(r.size_bytes)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => play(r.id)}>
                                                            <Play className="h-3 w-3" /> Play
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShareTarget(r)}>
                                                            <Share2 className="h-3 w-3" /> Share
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => download(r.id, r.room_code)}>
                                                            <Download className="h-3 w-3" /> Download
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        <TabsContent value="shared" className="mt-0">
                            {loading ? (
                                <div className="space-y-3 p-5">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : shared.length === 0 ? (
                                <EmptyState
                                    icon={Users}
                                    title="Nothing shared with you yet"
                                    description="Recordings other people share with you will show up here."
                                />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Meeting</TableHead>
                                            <TableHead>Shared by</TableHead>
                                            <TableHead>Shared</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {shared.map((s) => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">{s.room_title || "Untitled meeting"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary">{s.shared_by_name}</Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{fmtDate(s.shared_at)}</TableCell>
                                                <TableCell className="text-muted-foreground">{fmtSize(s.size_bytes)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => play(s.recording_id)}>
                                                            <Play className="h-3 w-3" /> Play
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => download(s.recording_id, s.room_code)}>
                                                            <Download className="h-3 w-3" /> Download
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>
                    </Tabs>
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

            <ShareRecordingDialog
                recording={shareTarget}
                open={!!shareTarget}
                onOpenChange={(open) => !open && setShareTarget(null)}
            />
        </AppShell>
    );
}
