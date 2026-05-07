import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [params] = useSearchParams();

  const [mode, setMode] = useState("password"); // "password" | "otp-email" | "otp-code"
  const [form, setForm] = useState({ email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState(params.get("reset") === "1" ? "Password updated. You can now sign in." : "");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    setLoading(true);
    try {
      const { data } = await authApi.login({ email: form.email, password: form.password });
      login(data.access_token);
      const { data: me } = await authApi.me();
      navigate(me.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpRequest = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    setLoading(true);
    try {
      await authApi.otpRequest(form.email);
      setInfo("Check your email for a 6-digit code.");
      setMode("otp-code");
    } catch (err) {
      setError(err.response?.data?.detail || "Could not send code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError(""); setInfo("");
    setLoading(true);
    try {
      const { data } = await authApi.otpVerify(form.email, form.otp);
      login(data.access_token);
      const { data: me } = await authApi.me();
      navigate(me.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next) => {
    setError(""); setInfo("");
    setForm((f) => ({ ...f, otp: "" }));
    setMode(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-foreground">MeetMind</span>
          <p className="text-sm text-muted-foreground mt-1">Team meeting intelligence</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              {mode === "password" && "Sign in to your account to continue"}
              {mode === "otp-email" && "Enter your email to receive a login code"}
              {mode === "otp-code" && `Enter the code sent to ${form.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <p className="text-sm text-destructive bg-destructive/8 border border-destructive/20 rounded-md px-3 py-2 mb-4">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2 mb-4">
                {info}
              </p>
            )}

            {/* Password login */}
            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="you@example.com"
                    value={form.email} onChange={handleChange} required autoComplete="email" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input id="password" name="password" type="password" placeholder="••••••••"
                    value={form.password} onChange={handleChange} required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
                <button type="button" onClick={() => switchMode("otp-email")}
                  className="w-full text-sm text-primary hover:underline text-center mt-1">
                  Sign in with a one-time code instead
                </button>
              </form>
            )}

            {/* OTP step 1: enter email */}
            {mode === "otp-email" && (
              <form onSubmit={handleOtpRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp-email">Email</Label>
                  <Input id="otp-email" name="email" type="email" placeholder="you@example.com"
                    value={form.email} onChange={handleChange} required autoComplete="email" />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? "Sending…" : "Send code"}
                </Button>
                <button type="button" onClick={() => switchMode("password")}
                  className="w-full text-sm text-muted-foreground hover:underline text-center">
                  Back to password login
                </button>
              </form>
            )}

            {/* OTP step 2: enter code */}
            {mode === "otp-code" && (
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="otp">6-digit code</Label>
                  <Input id="otp" name="otp" type="text" inputMode="numeric" maxLength={6}
                    placeholder="123456" value={form.otp} onChange={handleChange} required autoFocus />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {loading ? "Verifying…" : "Verify & sign in"}
                </Button>
                <button type="button" onClick={() => switchMode("otp-email")}
                  className="w-full text-sm text-muted-foreground hover:underline text-center">
                  Resend code
                </button>
              </form>
            )}

            <p className="text-sm text-center text-muted-foreground mt-5">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
