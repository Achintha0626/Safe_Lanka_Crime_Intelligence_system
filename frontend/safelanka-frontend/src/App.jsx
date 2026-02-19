import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
  Outlet,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Dashboard from "./components/Dashboard";
import Research from "./components/Research";
import Login from "./components/Login";
import Register from "./components/Register";
import AdminPanel from "./components/AdminPanel";
import PoliceDashboard from "./components/PoliceDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./components/LandingPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "rgba(30, 41, 59, 0.95)",
                color: "#fff",
                border: "1px solid rgba(59, 130, 246, 0.3)",
                backdropFilter: "blur(12px)",
              },
              success: {
                iconTheme: {
                  primary: "#10b981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Routes>
            {/* Landing Page (No Global Nav) */}
            <Route path="/" element={<LandingPage />} />

            {/* Main App Layout (With Global Nav) */}
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={["POLICE", "OFFICER", "SUPERVISOR"]}
                  />
                }
              >
                <Route path="/police" element={<PoliceDashboard />} />
              </Route>

              <Route element={<ProtectedRoute allowedRoles={["ANALYST"]} />}>
                <Route path="/research" element={<Research />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Layout wrapper for the main application (Navbar + Content)
function MainLayout() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* Navigation Bar */}
      <NavBar />

      {/* Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Outlet />
      </div>
    </div>
  );
}

// Theme Toggle Component
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      style={{
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border)",
        color: "var(--text-primary)",
        padding: "6px 10px",
        borderRadius: 8,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title="Toggle Theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

function NavBar() {
  const location = useLocation();
  const hideThemeToggle =
    location.pathname === "/login" || location.pathname === "/register";

  return (
    <nav
      style={{
        background: "var(--bg-secondary)",
        backdropFilter: "blur(10px)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        transition: "background-color 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <span
            style={{
              fontSize: "1.5rem",
              fontWeight: "800",
              background: "linear-gradient(to right, #3B82F6, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            SafeLanka
          </span>
        </Link>
        <span
          style={{
            background: "var(--bg-tertiary)",
            fontSize: "0.75rem",
            padding: "2px 8px",
            borderRadius: 12,
            color: "var(--text-secondary)",
          }}
        >
          v2.0
        </span>
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
        <NavLink to="/dashboard">Maps</NavLink>

        {/* Role Based Links */}
        <RoleLink role="ANALYST" to="/research">
          Analytics
        </RoleLink>
        <RoleLink role="POLICE" to="/police">
          Police Ops
        </RoleLink>
        <RoleLink role="ADMIN" to="/admin">
          Admin
        </RoleLink>

        {!hideThemeToggle && <ThemeToggle />}
        <AuthButton />
      </div>
    </nav>
  );
}

function NavLink({ to, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      style={{
        color: isActive ? "#60A5FA" : "var(--text-secondary)",
        textDecoration: "none",
        fontSize: "0.95rem",
        fontWeight: "500",
        transition: "color 0.2s",
        borderBottom: isActive ? "2px solid #60A5FA" : "2px solid transparent",
        paddingBottom: 4,
      }}
    >
      {children}
    </Link>
  );
}

// Helper to show links only if user has role
function RoleLink({ role, to, children }) {
  const { user } = useAuth();
  if (!user) return null;
  if (user.role === "ADMIN" || user.role === role) {
    return <NavLink to={to}>{children}</NavLink>;
  }
  return null;
}

function AuthButton() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (user) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: "0.85rem", color: "#9CA3AF" }}>
          {user.username} ({user.role})
        </span>
        <button
          onClick={handleLogout}
          style={{
            background: "#EF4444",
            color: "white",
            padding: "4px 12px",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          Logout
        </button>
      </div>
    );
  }
  return <NavLink to="/login">Login</NavLink>;
}

export default App;
