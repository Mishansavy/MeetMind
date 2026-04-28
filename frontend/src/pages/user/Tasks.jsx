import { useEffect, useState } from "react";
import { CheckSquare, Plus, Trash2, Check } from "lucide-react";
import { tasksApi } from "../../api/tasks";
import AppShell from "../../components/AppShell";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "../../components/ui/dialog";
import { cn } from "../../lib/utils";

const PRIORITY_VARIANT = { low: "secondary", medium: "warning", high: "destructive" };

function UrgencyBadge({ score }) {
    if (score == null) return <span className="text-muted-foreground/40">—</span>;
    if (score < 0.1) return <Badge variant="success">Low</Badge>;
    if (score < 0.3) return <Badge variant="warning">Medium</Badge>;
    return <Badge variant="destructive">High</Badge>;
}

function NewTaskDialog({ open, onOpenChange, onCreated }) {
    const [form, setForm] = useState({ title: "", assignee_name: "", deadline: "", priority: "medium" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const reset = () => { setForm({ title: "", assignee_name: "", deadline: "", priority: "medium" }); setError(""); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const payload = {
                title: form.title,
                priority: form.priority,
                assignee_name: form.assignee_name || null,
                deadline: form.deadline || null,
            };
            const res = await tasksApi.create(payload);
            onCreated(res.data);
            onOpenChange(false);
            reset();
        } catch {
            setError("Failed to create task.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>New task</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-1">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <div className="space-y-1.5">
                        <Label htmlFor="task-title">Title</Label>
                        <Input
                            id="task-title"
                            placeholder="e.g. Send follow-up email"
                            value={form.title}
                            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label htmlFor="task-assignee">Assignee</Label>
                            <Input
                                id="task-assignee"
                                placeholder="Name (optional)"
                                value={form.assignee_name}
                                onChange={(e) => setForm((f) => ({ ...f, assignee_name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="task-deadline">Deadline</Label>
                            <Input
                                id="task-deadline"
                                type="date"
                                value={form.deadline}
                                onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Priority</Label>
                        <div className="flex gap-2">
                            {["low", "medium", "high"].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                                    className={cn(
                                        "flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors capitalize",
                                        form.priority === p
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "border-border text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                        <DialogClose asChild>
                            <Button type="button" variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" size="sm" disabled={loading}>
                            {loading ? "Saving…" : "Create task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function Tasks() {
    const [tasks, setTasks] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);

    const fetchTasks = () =>
        tasksApi.list().then((r) => setTasks(r.data)).catch(() => {});

    useEffect(() => { fetchTasks(); }, []);

    const handleToggle = async (task) => {
        const updated = await tasksApi.update(task.id, { is_complete: !task.is_complete });
        setTasks((prev) => prev.map((t) => (t.id === task.id ? updated.data : t)));
    };

    const handleDelete = async (id) => {
        await tasksApi.remove(id).catch(() => {});
        setTasks((prev) => prev.filter((t) => t.id !== id));
    };

    const handleCreated = (task) => setTasks((prev) => [task, ...prev]);

    const pending = tasks.filter((t) => !t.is_complete);
    const done = tasks.filter((t) => t.is_complete);

    return (
        <AppShell>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <CheckSquare className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-xl font-semibold">Tasks</h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                        {pending.length} pending · {done.length} completed
                    </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4" /> New task
                </Button>
            </div>

            <Card>
                <CardContent className="p-0">
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <CheckSquare className="h-8 w-8 opacity-30" />
                            <p className="text-sm">No tasks yet</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8" />
                                    <TableHead>Title</TableHead>
                                    <TableHead>Assignee</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Urgency</TableHead>
                                    <TableHead />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.map((task) => (
                                    <TableRow key={task.id} className={cn(task.is_complete && "opacity-50")}>
                                        <TableCell>
                                            <button
                                                onClick={() => handleToggle(task)}
                                                className={cn(
                                                    "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                                    task.is_complete
                                                        ? "bg-primary border-primary text-white"
                                                        : "border-border hover:border-primary"
                                                )}
                                            >
                                                {task.is_complete && <Check className="h-3 w-3" />}
                                            </button>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn("font-medium", task.is_complete && "line-through text-muted-foreground")}>
                                                {task.title}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.assignee_name || <span className="text-muted-foreground/40">—</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {task.deadline
                                                ? new Date(task.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                : <span className="text-muted-foreground/40">—</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={PRIORITY_VARIANT[task.priority]} className="capitalize">
                                                {task.priority}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <UrgencyBadge score={task.urgency_score} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <NewTaskDialog open={dialogOpen} onOpenChange={setDialogOpen} onCreated={handleCreated} />
        </AppShell>
    );
}
