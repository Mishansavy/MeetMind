import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("invalid"); return; }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => {
        setStatus("success");
        setTimeout(() => navigate("/login"), 3000);
      })
      .catch(() => setStatus("invalid"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow text-center max-w-md w-full">
        {status === "verifying" && <p>Verifying your email...</p>}
        {status === "success" && (
          <>
            <p className="text-green-600 font-medium">Email verified!</p>
            <p className="text-sm text-gray-500 mt-2">
              Your account is pending admin approval. Redirecting to login...
            </p>
          </>
        )}
        {status === "invalid" && (
          <p className="text-red-500">Invalid or expired link. Please register again.</p>
        )}
      </div>
    </div>
  );
}