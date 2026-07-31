import { useEffect, useState } from "react";
import { CalendarCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import { attendanceApi } from "../../api/attendance";
import AdminShell from "../../components/AdminShell";
import { PageHeader } from "../../components/PageHeader";
import { StatCard, MetricGrid } from "../../components/StatCard";
import { EmptyState } from "../../components/EmptyState";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../components/ui/table";

function fmtTime(iso) {
    if (!iso) return "-";
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

export default function AdminAttendance() {
    const [records, setRecords] = useState([]);
    const [forDate, setForDate] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        attendanceApi.listAll(forDate || undefined)
            .then((r) => setRecords(r.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [forDate]);

    const checkedOut = records.filter((r) => r.check_out_at).length;
    const present = records.filter((r) => r.check_in_at && !r.check_out_at).length;
    const absent = records.length - checkedOut - present;

    return (
        <AdminShell>
            <PageHeader
                icon={CalendarCheck}
                title="Attendance"
                description={`${records.length} record${records.length === 1 ? "" : "s"}${forDate ? ` on ${forDate}` : ""}`}
                actions={
                    <div className="w-44">
                        <Label htmlFor="for_date">Filter by date</Label>
                        <Input id="for_date" type="date" value={forDate} onChange={(e) => setForDate(e.target.value)} />
                    </div>
                }
            />

            {!loading && records.length > 0 && (
                <MetricGrid className="mb-6">
                    <StatCard label="Present" value={present} icon={CheckCircle} tone="success" />
                    <StatCard label="Checked out" value={checkedOut} icon={Clock} tone="primary" />
                    <StatCard label="Absent" value={absent} icon={XCircle} tone="warning" />
                </MetricGrid>
            )}

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="space-y-3 p-5">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ) : records.length === 0 ? (
                        <EmptyState
                            icon={CalendarCheck}
                            title="No attendance records"
                            description={forDate ? "No one checked in on this date." : "Check-ins will appear here once employees start marking attendance."}
                        />
                    ) : (
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
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar className="h-7 w-7">
                                                    <AvatarFallback className="text-xs">{r.user_name?.[0]?.toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {r.user_name}
                                            </div>
                                        </TableCell>
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
                    )}
                </CardContent>
            </Card>
        </AdminShell>
    );
}
