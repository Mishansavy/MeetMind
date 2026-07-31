import { useState } from "react";
import { Share2 } from "lucide-react";
import { roomsApi } from "../api/rooms";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function ShareRecordingDialog({ recording, open, onOpenChange }) {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState(null);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const reset = () => { setEmail(""); setStatus(null); setError(""); };

    const handleOpenChange = (next) => {
        if (!next) reset();
        onOpenChange(next);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setSubmitting(true);
        setError("");
        setStatus(null);
        try {
            await roomsApi.shareRecording(recording.id, email.trim());
            setStatus(`Shared with ${email.trim()}. They'll get an email and can view it from their dashboard.`);
            setEmail("");
        } catch (err) {
            setError(err?.response?.data?.detail || "Couldn't share this recording.");
        } finally {
            setSubmitting(false);
        }
    };

    if (!recording) return null;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share recording</DialogTitle>
                    <DialogDescription>
                        {recording.room_title || "Untitled meeting"} · {recording.room_code}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                        <Label htmlFor="share_email">Share with (email)</Label>
                        <Input
                            id="share_email"
                            type="email"
                            placeholder="teammate@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {status && <p className="text-sm text-success">{status}</p>}

                    <div className="flex justify-end gap-2 pt-1">
                        <Button type="submit" size="sm" className="gap-1.5" disabled={submitting}>
                            <Share2 className="h-3.5 w-3.5" />
                            {submitting ? "Sharing..." : "Share"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
