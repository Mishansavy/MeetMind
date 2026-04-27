import { useEffect, useState } from "react";
import { Users, Trash2 } from "lucide-react";
import { adminApi } from "../../api/admin";
import AdminShell from "../../components/AdminShell";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
    SheetBody, SheetFooter,
} from "../../components/ui/sheet";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogClose,
} from "../../components/ui/dialog";
import {
    Mail, Calendar, ShieldCheck, CheckCircle, UserCheck, UserCircle,
} from "lucide-react";

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
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {member.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <SheetTitle>{member.name}</SheetTitle>
                            <SheetDescription>{member.email}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <SheetBody>
                    <div className="flex items-center gap-2 mb-5">
                        <Badge variant={member.role === "admin" ? "default" : "secondary"}>{member.role}</Badge>
                        <Badge variant={member.is_approved ? "success" : "warning"}>
                            {member.is_approved ? "Active" : "Pending approval"}
                        </Badge>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <DetailRow icon={UserCircle} label="Full name" value={member.name} />
                        <DetailRow icon={Mail} label="Email address" value={member.email} />
                        <DetailRow icon={ShieldCheck} label="Role" value={member.role} />
                        <DetailRow icon={CheckCircle} label="Account status" value={member.is_approved ? "Approved" : "Pending admin approval"} />
                        <DetailRow icon={Calendar} label="Joined" value={new Date(member.created_at).toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })} />
                    </div>
                </SheetBody>
                {member.role !== "admin" && (
                    <SheetFooter>
                        {!member.is_approved && (
                            <Button size="sm" className="gap-1.5" onClick={() => { onApprove(member.id); onOpenChange(false); }}>
                                <UserCheck className="h-3.5 w-3.5" /> Approve
                            </Button>
                        )}
                        <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => { onRemove(member.id); onOpenChange(false); }}>
                            <Trash2 className="h-3.5 w-3.5" /> Remove member
                        </Button>
                    </SheetFooter>
                )}
            </SheetContent>
        </Sheet>
    );
}

export default function AdminMembers() {
    const [members, setMembers] = useState([]);
    const [selected, setSelected] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const fetchData = () =>
        adminApi.getAllUsers().then((r) => setMembers(r.data)).catch(() => {});

    useEffect(() => { fetchData(); }, []);

    const handleApprove = (id) => adminApi.approveUser(id).then(fetchData).catch(() => {});
    const handleRemove = (id) => adminApi.removeUser(id).then(fetchData).catch(() => {});

    return (
        <AdminShell>
            <div className="mb-7">
                <div className="flex items-center gap-2 mb-1">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Members</h1>
                </div>
                <p className="text-sm text-muted-foreground pl-7">
                    {members.length} total · {members.filter((m) => m.is_approved).length} active
                </p>
            </div>

            <Card>
                <CardContent className="p-0">
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
                                <TableRow key={u.id} className="cursor-pointer" onClick={() => { setSelected(u); setSheetOpen(true); }}>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                {u.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="font-medium">{u.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
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
                                                onClick={() => setConfirm({ id: u.id, name: u.name })}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <MemberSheet
                member={selected}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onApprove={handleApprove}
                onRemove={(id) => setConfirm({ id, name: selected?.name })}
            />

            {confirm && (
                <Dialog open onOpenChange={(v) => !v && setConfirm(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove member</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove {confirm.name}? This cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2 mt-4">
                            <DialogClose asChild>
                                <Button variant="outline" size="sm">Cancel</Button>
                            </DialogClose>
                            <Button size="sm" variant="destructive" onClick={() => { handleRemove(confirm.id); setConfirm(null); }}>
                                Remove
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </AdminShell>
    );
}
