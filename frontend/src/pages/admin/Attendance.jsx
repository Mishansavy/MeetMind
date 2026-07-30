import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { attendanceApi } from "../../api/attendance";
import AdminShell from "../../components/AdminShell";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";

function fmtTime(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAttendance() {
    const [records, setRecords] = useState([]);
    const [forDate, setForDate] = useState("");

    useEffect(() => {
        attendanceApi.listAll(forDate || undefined).then((r) => setRecords(r.data)).catch(() => {});
    }, [forDate]);

    return (
        <AdminShell>
            <div className="mb-7 flex items-end justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                        <h1 className="text-xl font-semibold">Attendance</h1>
                    </div>
                    <p className="text-sm text-muted-foreground pl-7">{records.length} records</p>
                </div>
                <div className="w-44">
                    <Label htmlFor="for_date">Filter by date</Label>
                    <Input id="for_date" type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {records.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell className="font-medium">{r.user_name}</TableCell>
                                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                                    <TableCell className="text-muted-foreground">{fmtTime(r.check_in_at)}</TableCell>
                                    <TableCell className="text-muted-foreground">{fmtTime(r.check_out_at)}</TableCell>
                                    <TableCell>
                                        <Badge variant={r.check_out_at ? "secondary" : r.check_in_at ? "success" : "warning"}>
                                            {r.check_out_at ? "Checked out" : r.check_in_at ? "Present" : "Absent"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </AdminShell>
    );
}
