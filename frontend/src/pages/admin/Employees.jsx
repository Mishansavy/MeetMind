import { useEffect, useState } from "react";
import { Briefcase, Pencil, Plus, Trash2, UserCheck } from "lucide-react";
import { adminApi } from "../../api/admin";
import { employeesApi } from "../../api/employees";
import AdminShell from "../../components/AdminShell";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
    SheetBody, SheetFooter,
} from "../../components/ui/sheet";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose,
} from "../../components/ui/dialog";

const EMPTY_NEW_EMPLOYEE = { name: "", email: "", employee_id: "", department: "", designation: "", join_date: "" };

function AddEmployeeDialog({ open, onOpenChange, onCreated }) {
    const [form, setForm] = useState(EMPTY_NEW_EMPLOYEE);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (open) { setForm(EMPTY_NEW_EMPLOYEE); setError(""); }
    }, [open]);

    const handleCreate = async () => {
        if (!form.name || !form.email) {
            setError("Name and email are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await employeesApi.create({
                name: form.name,
                email: form.email,
                employee_id: form.employee_id || null,
                department: form.department || null,
                designation: form.designation || null,
                join_date: form.join_date || null,
            });
            onCreated();
            onOpenChange(false);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not add employee.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add employee</DialogTitle>
                    <DialogDescription>
                        Creates an account and emails an invite link so they can set their password.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                    <div>
                        <Label htmlFor="new_name">Full name</Label>
                        <Input id="new_name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="new_email">Email</Label>
                        <Input id="new_email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="new_employee_id">Employee ID</Label>
                        <Input id="new_employee_id" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="new_department">Department</Label>
                        <Input id="new_department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="new_designation">Designation</Label>
                        <Input id="new_designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                    </div>
                    <div>
                        <Label htmlFor="new_join_date">Join date</Label>
                        <Input id="new_join_date" type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                </div>
                <div className="flex justify-end mt-4">
                    <Button size="sm" onClick={handleCreate} disabled={saving}>
                        {saving ? "Adding..." : "Add employee"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function EditEmployeeSheet({ employee, open, onOpenChange, onSaved, onApprove, onRemove }) {
    const [form, setForm] = useState({ name: "", email: "", employee_id: "", department: "", designation: "", join_date: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!employee) return;
        setForm({
            name: employee.name || "",
            email: employee.email || "",
            employee_id: employee.employee_id || "",
            department: employee.department || "",
            designation: employee.designation || "",
            join_date: employee.join_date || "",
        });
        setError("");
    }, [employee]);

    if (!employee) return null;

    const handleSave = async () => {
        if (!form.name || !form.email) {
            setError("Name and email are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await employeesApi.update(employee.id, {
                name: form.name,
                email: form.email,
                employee_id: form.employee_id || null,
                department: form.department || null,
                designation: form.designation || null,
                join_date: form.join_date || null,
            });
            onSaved();
            onOpenChange(false);
        } catch (err) {
            setError(err?.response?.data?.detail || "Could not save changes.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent>
                <SheetHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {employee.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <SheetTitle>{employee.name}</SheetTitle>
                            <SheetDescription>{employee.email}</SheetDescription>
                        </div>
                    </div>
                </SheetHeader>
                <SheetBody>
                    <div className="flex items-center gap-2 mb-5">
                        <Badge variant={employee.role === "admin" ? "default" : "secondary"}>{employee.role}</Badge>
                        <Badge variant={employee.is_approved ? "success" : "warning"}>
                            {employee.is_approved ? "Active" : "Pending approval"}
                        </Badge>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit_name">Full name</Label>
                            <Input id="edit_name" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="edit_email">Email</Label>
                            <Input id="edit_email" type="email" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="employee_id">Employee ID</Label>
                            <Input id="employee_id" value={form.employee_id}
                                onChange={(e) => setForm({ ...form, employee_id: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="department">Department</Label>
                            <Input id="department" value={form.department}
                                onChange={(e) => setForm({ ...form, department: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="designation">Designation</Label>
                            <Input id="designation" value={form.designation}
                                onChange={(e) => setForm({ ...form, designation: e.target.value })} />
                        </div>
                        <div>
                            <Label htmlFor="join_date">Join date</Label>
                            <Input id="join_date" type="date" value={form.join_date}
                                onChange={(e) => setForm({ ...form, join_date: e.target.value })} />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                </SheetBody>
                <SheetFooter>
                    {employee.role !== "admin" && !employee.is_approved && (
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { onApprove(employee.id); onOpenChange(false); }}>
                            <UserCheck className="h-3.5 w-3.5" /> Approve
                        </Button>
                    )}
                    {employee.role !== "admin" && (
                        <Button size="sm" variant="destructive" className="gap-1.5" onClick={() => onRemove(employee)}>
                            <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                    )}
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save changes"}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}

export default function AdminEmployees() {
    const [employees, setEmployees] = useState([]);
    const [selected, setSelected] = useState(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [addOpen, setAddOpen] = useState(false);
    const [confirm, setConfirm] = useState(null);

    const fetchData = () =>
        adminApi.getAllUsers().then((r) => setEmployees(r.data)).catch(() => {});

    useEffect(() => { fetchData(); }, []);

    const handleApprove = (id) => adminApi.approveUser(id).then(fetchData).catch(() => {});
    const handleRemove = (id) => adminApi.removeUser(id).then(fetchData).catch(() => {});

    return (
        <AdminShell>
            <div className="mb-7 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-xl font-semibold">Employees</h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">
                        {employees.length} total · {employees.filter((e) => e.is_approved).length} active
                    </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add employee
                </Button>
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
                                <TableHead>Department</TableHead>
                                <TableHead>Designation</TableHead>
                                <TableHead />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {employees.map((e) => (
                                <TableRow key={e.id} className="cursor-pointer" onClick={() => { setSelected(e); setSheetOpen(true); }}>
                                    <TableCell>
                                        <div className="flex items-center gap-2.5">
                                            <div className="h-7 w-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                                {e.name?.[0]?.toUpperCase()}
                                            </div>
                                            <span className="font-medium">{e.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{e.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={e.role === "admin" ? "default" : "secondary"}>{e.role}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={e.is_approved ? "success" : "warning"}>
                                            {e.is_approved ? "Active" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {e.department ? <Badge variant="secondary">{e.department}</Badge> : <span className="text-muted-foreground">-</span>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{e.designation || "-"}</TableCell>
                                    <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={() => { setSelected(e); setSheetOpen(true); }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {e.role !== "admin" && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    onClick={() => setConfirm({ id: e.id, name: e.name })}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditEmployeeSheet
                employee={selected}
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                onSaved={fetchData}
                onApprove={handleApprove}
                onRemove={(employee) => setConfirm({ id: employee.id, name: employee.name })}
            />

            <AddEmployeeDialog
                open={addOpen}
                onOpenChange={setAddOpen}
                onCreated={fetchData}
            />

            {confirm && (
                <Dialog open onOpenChange={(v) => !v && setConfirm(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove employee</DialogTitle>
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
