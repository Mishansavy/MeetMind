import { useEffect, useState, useRef } from "react";
import { FileText, Plus, Trash2, Upload, AlignLeft, FileUp, Zap, Check } from "lucide-react";
import { meetingsApi } from "../../api/meetings";
import { tasksApi } from "../../api/tasks";
import AppShell from "../../components/AppShell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";

const PRIORITY_VARIANT = { low: "secondary", medium: "warning", high: "destructive" };

function NoteList({ notes, selectedId, onSelect }) {
    if (notes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <FileText className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notes yet</p>
            </div>
        );
    }

    return (
        <ul className="divide-y divide-border">
            {notes.map((note) => (
                <li key={note.id}>
                    <button
                        onClick={() => onSelect(note)}
                        className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors ${selectedId === note.id ? "bg-muted/60" : ""}`}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">{note.title}</span>
                            <Badge variant={note.source === "pdf" ? "secondary" : "outline"} className="shrink-0 text-xs">
                                {note.source}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                    </button>
                </li>
            ))}
        </ul>
    );
}

function ExtractDialog({ note, open, onOpenChange, onSaved }) {
    const [previews, setPreviews] = useState([]);
    const [selected, setSelected] = useState(new Set());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open || !note) return;
        setLoading(true);
        setError("");
        tasksApi.extractFromNote(note.id)
            .then((r) => {
                setPreviews(r.data);
                setSelected(new Set(r.data.map((_, i) => i)));
            })
            .catch(() => setError("Extraction failed."))
            .finally(() => setLoading(false));
    }, [open, note]);

    const toggleAll = () => {
        setSelected(selected.size === previews.length ? new Set() : new Set(previews.map((_, i) => i)));
    };

    const toggle = (i) => {
        const next = new Set(selected);
        next.has(i) ? next.delete(i) : next.add(i);
        setSelected(next);
    };

    const handleSave = async () => {
        const chosen = previews.filter((_, i) => selected.has(i));
        if (!chosen.length) return;
        setSaving(true);
        try {
            await tasksApi.bulkSave(note.id, chosen);
            onSaved();
            onOpenChange(false);
        } catch {
            setError("Failed to save tasks.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Extract tasks from note</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="py-8 text-center text-sm text-muted-foreground">Scanning for action items…</div>
                )}

                {!loading && error && <p className="text-sm text-destructive">{error}</p>}

                {!loading && !error && previews.length === 0 && (
                    <div className="py-8 text-center text-sm text-muted-foreground">No action items detected in this note.</div>
                )}

                {!loading && previews.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-2 mt-1">
                            <p className="text-xs text-muted-foreground">{previews.length} action items found</p>
                            <button onClick={toggleAll} className="text-xs text-primary hover:underline">
                                {selected.size === previews.length ? "Deselect all" : "Select all"}
                            </button>
                        </div>
                        <ul className="space-y-2 max-h-72 overflow-y-auto">
                            {previews.map((p, i) => (
                                <li
                                    key={i}
                                    onClick={() => toggle(i)}
                                    className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                        selected.has(i) ? "border-primary/40 bg-primary/5" : "border-border"
                                    )}
                                >
                                    <div className={cn(
                                        "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                                        selected.has(i) ? "bg-primary border-primary text-white" : "border-border"
                                    )}>
                                        {selected.has(i) && <Check className="h-2.5 w-2.5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">{p.title}</p>
                                    </div>
                                    <Badge variant={PRIORITY_VARIANT[p.priority]} className="capitalize shrink-0">
                                        {p.priority}
                                    </Badge>
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <div className="flex justify-end gap-2 mt-2">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">Cancel</Button>
                    </DialogClose>
                    {previews.length > 0 && (
                        <Button size="sm" disabled={saving || selected.size === 0} onClick={handleSave}>
                            {saving ? "Saving…" : `Save ${selected.size} task${selected.size !== 1 ? "s" : ""}`}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function NoteDetail({ note, onDelete, onExtract }) {
    if (!note) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <AlignLeft className="h-8 w-8 opacity-30" />
                <p className="text-sm">Select a note to read it</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-base font-semibold">{note.title}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(note.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        {" · "}
                        <Badge variant={note.source === "pdf" ? "secondary" : "outline"} className="text-xs">{note.source}</Badge>
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => onExtract(note)}
                    >
                        <Zap className="h-3.5 w-3.5" /> Extract tasks
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(note.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
            </div>
        </div>
    );
}

function NewNoteDialog({ open, onOpenChange, onCreated }) {
    const [tab, setTab] = useState("text");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileRef = useRef(null);

    const reset = () => { setTitle(""); setContent(""); setFile(null); setError(""); setTab("text"); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            let res;
            if (tab === "text") {
                res = await meetingsApi.create({ title, content, source: "text" });
            } else {
                if (!file) { setError("Pick a PDF file."); setLoading(false); return; }
                res = await meetingsApi.upload(title, file);
            }
            onCreated(res.data);
            onOpenChange(false);
            reset();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to save note.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>New meeting note</DialogTitle>
                </DialogHeader>

                <div className="flex gap-1 border-b border-border mb-4">
                    {[{ key: "text", icon: AlignLeft, label: "Paste text" }, { key: "pdf", icon: FileUp, label: "Upload PDF" }].map(({ key, icon: Icon, label }) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium relative transition-colors ${
                                tab === key
                                    ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <div className="space-y-1.5">
                        <Label htmlFor="note-title">Title</Label>
                        <Input
                            id="note-title"
                            placeholder="e.g. Sprint planning — Apr 26"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {tab === "text" ? (
                        <div className="space-y-1.5">
                            <Label htmlFor="note-content">Notes</Label>
                            <textarea
                                id="note-content"
                                rows={8}
                                placeholder="Paste your meeting notes here…"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            <Label>PDF file</Label>
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg py-8 cursor-pointer hover:bg-muted/30 transition-colors"
                            >
                                <Upload className="h-6 w-6 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                    {file ? file.name : "Click to pick a PDF"}
                                </p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files[0] || null)}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Saving…" : "Save note"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function MeetingNotes() {
    const [notes, setNotes] = useState([]);
    const [selected, setSelected] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [extractNote, setExtractNote] = useState(null);

    const fetchNotes = () =>
        meetingsApi.list().then((r) => setNotes(r.data)).catch(() => {});

    useEffect(() => { fetchNotes(); }, []);

    const handleDelete = async (id) => {
        await meetingsApi.remove(id).catch(() => {});
        setNotes((prev) => prev.filter((n) => n.id !== id));
        if (selected?.id === id) setSelected(null);
    };

    const handleCreated = (note) => {
        setNotes((prev) => [note, ...prev]);
        setSelected(note);
    };

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-semibold">Meeting Notes</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {notes.length} {notes.length === 1 ? "note" : "notes"}
                    </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> New note
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)]">
                <Card className="overflow-y-auto">
                    <NoteList
                        notes={notes}
                        selectedId={selected?.id}
                        onSelect={setSelected}
                    />
                </Card>

                <Card>
                    <CardContent className="p-5 h-full">
                        <NoteDetail
                            note={selected}
                            onDelete={handleDelete}
                            onExtract={setExtractNote}
                        />
                    </CardContent>
                </Card>
            </div>

            <NewNoteDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onCreated={handleCreated}
            />

            <ExtractDialog
                note={extractNote}
                open={!!extractNote}
                onOpenChange={(v) => { if (!v) setExtractNote(null); }}
                onSaved={() => {}}
            />
        </AppShell>
    );
}
