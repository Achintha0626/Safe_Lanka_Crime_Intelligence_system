import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (err) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
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
            Create Account
          </h2>
          <p style={{ color: "#94A3B8" }}>Join SafeLanka Intelligence Portal</p>
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
            disabled={loading}
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
            placeholder="Choose a username"
          />
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
            Email (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
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
            placeholder="your@email.com"
          />
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
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
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
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
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
          {loading ? "Creating Account..." : "Create Account"}
        </button>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <Link
            to="/login"
            style={{
              color: "#60A5FA",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Already have an account? Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
