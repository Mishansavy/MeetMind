import { useLocation, Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function PendingApproval() {
  const { state } = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold tracking-tight text-foreground">MeetMind</span>
        </div>

        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Check your inbox</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {state?.message || "Your account is pending admin approval."}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Once an admin approves your account, you&apos;ll be able to sign in.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/login">Back to Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
