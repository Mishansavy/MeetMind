import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "../api/auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight">MeetMind</span>
          <p className="text-sm text-muted-foreground mt-1">Team meeting intelligence</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Forgot password</CardTitle>
            <CardDescription>
              {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!sent ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            ) : (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                If that email is registered, a reset link has been sent. Check your inbox.
              </p>
            )}

            <p className="text-sm text-center text-muted-foreground mt-5">
              <Link to="/login" className="text-primary font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
