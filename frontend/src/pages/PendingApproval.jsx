import { useLocation } from "react-router-dom";

export default function PendingApproval() {
  const { state } = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow text-center max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">Almost there!</h2>
        <p className="text-gray-600 text-sm">
          {state?.message || "Your account is pending admin approval."}
        </p>
        <p className="text-gray-400 text-xs mt-4">
          You will be able to log in once the admin approves your account.
        </p>
      </div>
    </div>
  );
}