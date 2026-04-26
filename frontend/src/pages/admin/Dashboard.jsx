import { useEffect, useState } from "react";
import {
    Users, Clock, CheckCircle, Trash2, UserCheck, LayoutDashboard,
} from "lucide-react";
import { adminApi } from "../../api/admin";
import AppShell from "../../components/AppShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogClose,
} from "../../components/ui/dialog";

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <Card>
            <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold leading-none">{value}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

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

export default function AdminDashboard() {
    const [pending, setPending] = useState([]);
    const [members, setMembers] = useState([]);
    const [tab, setTab] = useState("pending");
    const [confirm, setConfirm] = useState(null);

    const fetchData = () => {
        adminApi.getPending().then((r) => setPending(r.data)).catch(() => {});
        adminApi.getAllUsers().then((r) => setMembers(r.data)).catch(() => {});
    };

    useEffect(() => { fetchData(); }, []);

    const handleApprove = (id) =>
        adminApi.approveUser(id).then(fetchData).catch(() => {});

    const handleRemove = (id) =>
        adminApi.removeUser(id).then(fetchData).catch(() => {});

    const approved = members.filter((m) => m.is_approved);

    return (
        <AppShell>
            <div className="mb-7">
                <div className="flex items-center gap-2 mb-1">
                    <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Admin Dashboard</h1>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                    Manage members and review pending approvals.
                </p>
            </div>

            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard label="Total members" value={members.length} icon={Users} color="bg-blue-50 text-blue-600" />
                    <StatCard label="Pending approvals" value={pending.length} icon={Clock} color="bg-amber-50 text-amber-600" />
                    <StatCard label="Active members" value={approved.length} icon={CheckCircle} color="bg-emerald-50 text-emerald-600" />
                </div>

                <Card>
                    <div className="flex border-b border-border">
                        {[
                            { key: "pending", label: "Pending", count: pending.length },
                            { key: "members", label: "All Members", count: members.length },
                        ].map(({ key, label, count }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                                    tab === key
                                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {label}
                                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {count}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        {tab === "pending" && (
                            pending.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <CheckCircle className="h-8 w-8 opacity-30" />
                                    <p className="text-sm">No pending approvals</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-muted/40">
                                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Name</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Email</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Registered</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.map((u) => (
                                            <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                                <td className="px-4 py-3 text-sm text-muted-foreground">
                                                    {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </td>
                                                <td className="px-4 py-3">
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
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}

                        {tab === "members" && (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40">
                                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Name</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Email</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Role</th>
                                        <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 uppercase tracking-wide">Status</th>
                                        <th className="px-4 py-2.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((u) => (
                                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium">{u.name}</td>
                                            <td className="px-4 py-3 text-sm text-muted-foreground">{u.email}</td>
                                            <td className="px-4 py-3">
                                                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={u.is_approved ? "success" : "warning"}>
                                                    {u.is_approved ? "Active" : "Pending"}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {u.role !== "admin" && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() => setConfirm({ id: u.id, name: u.name, action: "remove" })}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </Card>
            </div>

            {confirm && (
                <ConfirmDialog
                    open
                    onOpenChange={(open) => !open && setConfirm(null)}
                    title={confirm.action === "reject" ? "Reject request" : "Remove member"}
                    description={`Are you sure you want to ${confirm.action} ${confirm.name}? This cannot be undone.`}
                    onConfirm={() => handleRemove(confirm.id)}
                />
            )}
        </AppShell>
    );
}
