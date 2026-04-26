import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-lg text-blue-600">MeetMind</span>
        <button onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500">
          Logout
        </button>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-800">System Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">
          More features coming in the next sprint.
        </p>
      </main>
    </div>
  );
}