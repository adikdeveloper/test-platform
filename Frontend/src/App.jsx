import { useEffect, useState } from "react";
import AdminDashboard from "./components/AdminDashboard";
import LoginForm from "./components/LoginForm";
import StudentDashboard from "./components/StudentDashboard";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const STORAGE_KEY = "aydos-user";

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser);
  const [dashboard, setDashboard] = useState(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  async function fetchDashboard(currentUser = user) {
    if (!currentUser) {
      return;
    }

    setIsLoadingDashboard(true);
    setDashboardError("");

    try {
      const dashboardUrl =
        currentUser.role === "student"
          ? `${API_URL}/student/dashboard/${currentUser.id}`
          : `${API_URL}/admin/dashboard`;
      const response = await fetch(dashboardUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Dashboard ma'lumotlari olinmadi");
      }

      setDashboard(data.data);
    } catch (error) {
      setDashboardError(error.message || "Dashboard yuklanmadi");
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  useEffect(() => {
    if (!user) {
      setDashboard(null);
      setDashboardError("");
      return;
    }

    void fetchDashboard(user);
  }, [user]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!user) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  function handleLogout() {
    setUser(null);
  }

  if (user) {
    return (
      <main className="page page-dashboard">
        {user.role === "student" ? (
          <StudentDashboard
            user={user}
            dashboard={dashboard}
            error={dashboardError}
            isLoading={isLoadingDashboard}
            onLogout={handleLogout}
            onRefresh={() => fetchDashboard(user)}
          />
        ) : (
          <AdminDashboard
            user={user}
            dashboard={dashboard}
            error={dashboardError}
            isLoading={isLoadingDashboard}
            onDashboardUpdate={setDashboard}
            onLogout={handleLogout}
            onRefresh={() => fetchDashboard(user)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="page page-login">
      <section className="login-layout">
        <div className="login-copy">
          <span className="eyebrow">Aydos</span>
          <h1>Tizimga kirish</h1>
          <p>
            Shaxsiy kabinetga kirish uchun telefon raqamingiz va parolingizni kiriting.
          </p>
        </div>

        <LoginForm onLoginSuccess={setUser} />
      </section>
    </main>
  );
}

export default App;
