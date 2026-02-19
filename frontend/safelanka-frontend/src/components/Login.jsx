import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    const res = await login(username, password);
    setLoading(false);

    if (res.success) {
      toast.success(`Welcome back, ${username}!`);
      // Role-based redirection
      switch (res.role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "POLICE": // Legacy role
        case "OFFICER":
        case "SUPERVISOR":
          navigate("/police");
          break;
        case "ANALYST":
          navigate("/research");
          break;
        default:
          navigate("/dashboard");
      }
    } else {
      toast.error(res.error || "Login failed. Please check your credentials.");
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0F172A",
      }}
    >
      {/* Background Elements */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 50%)",
            animation: "pulse 10s infinite",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(15, 23, 42, 0.8), #0F172A)",
          }}
        ></div>
        {/* Subtle Grid Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            opacity: 0.3,
          }}
        ></div>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(30, 41, 59, 0.8)",
          backdropFilter: "blur(12px)",
          padding: 40,
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: 360,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>🛡️</div>
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "white",
              marginBottom: 4,
            }}
          >
            Welcome Back
          </h2>
          <p style={{ color: "#94A3B8" }}>SafeLanka Intelligence Portal</p>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: "block",
              color: "#CBD5E1",
              marginBottom: 8,
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #334155",
              color: "white",
              borderRadius: 8,
              outline: "none",
              fontSize: "1rem",
              transition: "border-color 0.2s",
            }}
            placeholder="Enter your ID"
          />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label
            style={{
              display: "block",
              color: "#CBD5E1",
              marginBottom: 8,
              fontSize: "0.9rem",
              fontWeight: "500",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid #334155",
              color: "white",
              borderRadius: 8,
              outline: "none",
              fontSize: "1rem",
            }}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#6B7280" : "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: "1rem",
            transition: "background 0.2s",
          }}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link
            to="/register"
            style={{
              color: "#60A5FA",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Don't have an account? Register
          </Link>
        </div>
      </form>
    </div>
  );
}
