import { useEffect, useState } from "react";
import {
    Users, Clock, CheckCircle, Trash2, UserCheck,
    LayoutDashboard, Mail, Calendar, ShieldCheck, UserCircle, CheckSquare,
} from "lucide-react";
import { adminApi } from "../../api/admin";
import AdminShell from "../../components/AdminShell";
import { PageHeader } from "../../components/PageHeader";
import { StatCard, MetricGrid } from "../../components/StatCard";
import { EmptyState } from "../../components/EmptyState";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import { cn } from "../../lib/utils";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogClose,
} from "../../components/ui/dialog";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
    SheetDescription, SheetBody, SheetFooter,
} from "../../components/ui/sheet";

function ConfirmDialog({ open, onOpenChange, title, description, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                    <DialogClose asChild>
                        <Button variant="outline" size="sm">Cancel</Button>
                    </DialogClose>
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => { onConfirm(); onOpenChange(false); }}
                    >
                        Confirm
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function DetailRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium mt-0.5">{value}</p>
            </div>
        </div>
    );
}

function MemberSheet({ member, open, onOpenChange, onApprove, onRemove }) {
    if (!member) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="text-sm">{member.name?.[0]?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <SheetTitle>{member.name}</SheetTitle>
                            <SheetDescription>{member.email}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <SheetBody>
                    <div className="flex items-center gap-2 mb-5">
                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                            {member.role}
                        </Badge>
                        <Badge variant={member.is_approved ? "success" : "warning"}>
                            {member.is_approved ? "Active" : "Pending approval"}
                        </Badge>
                    </div>

                    <div className="rounded-lg border border-border overflow-hidden">
                        <DetailRow icon={UserCircle} label="Full name" value={member.name} />
                        <DetailRow icon={Mail} label="Email address" value={member.email} />
                        <DetailRow icon={ShieldCheck} label="Role" value={member.role} />
                        <DetailRow
                            icon={CheckCircle}
                            label="Account status"
                            value={member.is_approved ? "Approved" : "Pending admin approval"}
                        />
                        <DetailRow
                            icon={Calendar}
                            label="Joined"
                            value={new Date(member.created_at).toLocaleDateString("en-US", {
                                weekday: "short", month: "long", day: "numeric", year: "numeric",
                            })}
                        />
                    </div>
                </SheetBody>

                {member.role !== "admin" && (
                    <SheetFooter>
                        {!member.is_approved && (
                            <Button
                                size="sm"
                                className="gap-1.5"
                                onClick={() => { onApprove(member.id); onOpenChange(false); }}
                            >
                                <UserCheck className="h-3.5 w-3.5" /> Approve
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="destructive"
                            className="gap-1.5"
                            onClick={() => { onRemove(member.id); onOpenChange(false); }}
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Remove member
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}

const PRIORITY_VARIANT = { low: "secondary", medium: "warning", high: "destructive" };

function UrgencyBadge({ score }) {
    if (score == null) return <span className="text-muted-foreground/40">-</span>;
    if (score < 0.1) return <Badge variant="success">Low</Badge>;
    if (score < 0.3) return <Badge variant="warning">Med</Badge>;
    return <Badge variant="destructive">High</Badge>;
}

// transcript-extracted titles are full sentences, so truncate with an expand toggle
function TaskTitleCell({ title, isComplete }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={cn(
                "text-left font-medium max-w-xs",
                expanded ? "" : "line-clamp-2",
                isComplete && "line-through text-muted-foreground"
            )}
        >
            {title}
        </button>
    );
}

export default function AdminDashboard() {
    const [pending, setPending] = useState([]);
    const [members, setMembers] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [confirm, setConfirm] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = () => {
        Promise.all([
            adminApi.getPending().then((r) => setPending(r.data)).catch(() => {}),
            adminApi.getAllUsers().then((r) => setMembers(r.data)).catch(() => {}),
            adminApi.getAllTasks().then((r) => setAllTasks(r.data)).catch(() => {}),
        ]).finally(() => setLoading(false));
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = (id) =>
        adminApi.approveUser(id).then(fetchData).catch(() => {});

    const handleRemove = (id) =>
        adminApi.removeUser(id).then(fetchData).catch(() => {});

    const openDetail = (member) => {
        setSelectedMember(member);
        setSheetOpen(true);
    };

    const approved = members.filter((m) => m.is_approved);

    return (
        <AdminShell>
            <PageHeader
                icon={LayoutDashboard}
                title="Dashboard"
                description="Manage members and review pending approvals."
            />

            <div className="space-y-6 animate-fade-in">
                {loading ? (
                    <MetricGrid>
                        <Skeleton className="h-[104px]" />
                        <Skeleton className="h-[104px]" />
                        <Skeleton className="h-[104px]" />
                    </MetricGrid>
                ) : (
                    <MetricGrid>
                        <StatCard label="Total members" value={members.length} icon={Users} tone="primary" />
                        <StatCard label="Pending approvals" value={pending.length} icon={Clock} tone="warning" />
                        <StatCard label="Active members" value={approved.length} icon={CheckCircle} tone="success" />
                    </MetricGrid>
                )}

                <Card>
                    <CardContent className="p-0">
                        <Tabs defaultValue="pending">
                            <div className="px-4 pt-4 pb-0 border-b border-border">
                                <TabsList className="bg-transparent p-0 h-auto gap-0 rounded-none w-auto">
                                    {[
                                        { value: "pending", label: "Pending", count: pending.length, showCount: true },
                                        { value: "members", label: "All Members", count: members.length, showCount: false },
                                        { value: "tasks", label: "Meeting Tasks", count: allTasks.length, showCount: false },
                                    ].map(({ value, label, count, showCount }) => (
                                        <TabsTrigger
                                            key={value}
                                            value={value}
                                            className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-0 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none text-muted-foreground"
                                        >
                                            {label}
                                            {count > 0 && (
                                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${showCount && count > 0 ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
                                                    {count}
                                                </span>
                                            )}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>

                            <TabsContent value="pending" className="mt-0">
                                {pending.length === 0 ? (
                                    <EmptyState
                                        icon={CheckCircle}
                                        title="No pending approvals"
                                        description="New sign-ups will show up here for review."
                                    />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Email</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pending.map((u) => (
                                                <TableRow
                                                    key={u.id}
                                                    className="cursor-pointer"
                                                    onClick={() => openDetail(u)}
                                                >
                                                    <TableCell className="font-medium">{u.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </TableCell>
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApprove(u.id)}
                                                                className="h-7 text-xs gap-1"
                                                            >
                                                                <UserCheck className="h-3 w-3" /> Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setConfirm({ id: u.id, name: u.name, action: "reject" })}
                                                                className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-3 w-3" /> Reject
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </TabsContent>

                            <TabsContent value="members" className="mt-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((u) => (
                                            <TableRow
                                                key={u.id}
                                                className="cursor-pointer"
                                                onClick={() => openDetail(u)}
                                            >
                                                <TableCell>
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="text-xs">{u.name?.[0]?.toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{u.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                                        {u.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={u.is_approved ? "success" : "warning"}>
                                                        {u.is_approved ? "Active" : "Pending"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                    {u.role !== "admin" && (
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                            onClick={() => setConfirm({ id: u.id, name: u.name, action: "remove" })}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TabsContent>
                            <TabsContent value="tasks" className="mt-0">
                                {allTasks.length === 0 ? (
                                    <EmptyState
                                        icon={CheckSquare}
                                        title="No tasks yet"
                                        description="Tasks extracted from meeting transcripts will appear here."
                                    />
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Member</TableHead>
                                                <TableHead>Assignee</TableHead>
                                                <TableHead>Deadline</TableHead>
                                                <TableHead>Priority</TableHead>
                                                <TableHead>Urgency</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {allTasks.map((task) => (
                                                <TableRow key={task.id} className={cn(task.is_complete && "opacity-50")}>
                                                    <TableCell>
                                                        <TaskTitleCell title={task.title} isComplete={task.is_complete} />
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{task.user_name}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {task.assignee_name || <span className="text-muted-foreground/40">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {task.deadline
                                                            ? new Date(task.deadline + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                                                            : <span className="text-muted-foreground/40">-</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={PRIORITY_VARIANT[task.priority]} className="capitalize">
                                                            {task.priority}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <UrgencyBadge score={task.urgency_score} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={task.is_complete ? "success" : "secondary"}>
                                                            {task.is_complete ? "Done" : "Pending"}
                                                        </Badge>
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
            </div>

            <MemberSheet
                member={selectedMember}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onApprove={handleApprove}
                onRemove={(id) => setConfirm({ id, name: selectedMember?.name, action: "remove" })}
            />

            {confirm && (
                <ConfirmDialog
                    open
                    onOpenChange={(open) => !open && setConfirm(null)}
                    title={confirm.action === "reject" ? "Reject request" : "Remove member"}
                    description={`Are you sure you want to ${confirm.action} ${confirm.name}? This cannot be undone.`}
                    onConfirm={() => handleRemove(confirm.id)}
                />
            )}
        </AdminShell>
    );
}
