import { useEffect, useState } from "react";
import { Users, Clock, CheckCircle, Trash2, UserCheck, LayoutDashboard } from "lucide-react";
import { adminApi } from "../../api/admin";
import AppShell from "../../components/AppShell";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
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
                    <CardHeader className="pb-0">
                        <Tabs defaultValue="pending">
                            <TabsList>
                                <TabsTrigger value="pending">
                                    Pending
                                    {pending.length > 0 && (
                                        <span className="ml-1.5 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                                            {pending.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                                <TabsTrigger value="members">
                                    All Members
                                    <span className="ml-1.5 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                                        {members.length}
                                    </span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="pending">
                                {pending.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                        <CheckCircle className="h-8 w-8 opacity-30" />
                                        <p className="text-sm">No pending approvals</p>
                                    </div>
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
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-medium">{u.name}</TableCell>
                                                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                    </TableCell>
                                                    <TableCell>
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

                            <TabsContent value="members">
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
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">{u.name}</TableCell>
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
                                                <TableCell className="text-right">
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
                        </Tabs>
                    </CardHeader>
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
