import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { authApi } from "../api/auth";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

const STATES = {
  verifying: {
    icon: <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />,
    title: "Verifying your email…",
    description: "This will only take a moment.",
  },
  success: {
    icon: <CheckCircle className="h-10 w-10 text-emerald-500" />,
    title: "Email verified",
    description: "Your account is pending admin approval. You'll be redirected to login shortly.",
  },
  invalid: {
    icon: <XCircle className="h-10 w-10 text-destructive" />,
    title: "Link expired or invalid",
    description: "This verification link is no longer valid. Please register again.",
  },
};

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("invalid"); return; }

    authApi.verifyEmail(token)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(() => setStatus("invalid"));
  }, []);

  const { icon, title, description } = STATES[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-foreground">MeetMind</span>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            {icon}
            <div>
              <h2 className="text-base font-semibold">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            {status === "invalid" && (
              <Button asChild variant="outline" size="sm">
                <Link to="/register">Back to Register</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
