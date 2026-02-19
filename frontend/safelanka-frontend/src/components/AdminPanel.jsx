import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const API_BASE = "/api/admin";

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    year: 2025,
    month: 1,
    district: "Colombo",
    crime_type: "Total Crimes",
    crime_count: 0,
  });

  // User Management State
  const [activeTab, setActiveTab] = useState("records");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchRecords();
    if (activeTab === "users") fetchUsers();
  }, [user, navigate, activeTab]);

  const fetchUsers = () => {
    fetch(`${API_BASE}/users/`, { credentials: "include" })
      .then((res) => res.json())
      .then(setUsers)
      .catch(console.error);
  };

  const handleUpdateRole = async (userId, newRole) => {
    const res = await fetch(`${API_BASE}/users/${userId}/role/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body: JSON.stringify({ role: newRole }),
      credentials: "include",
    });
    if (res.ok) fetchUsers();
    else alert("Update failed");
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`${API_BASE}/users/${userId}/delete/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      credentials: "include",
    });
    if (res.ok) fetchUsers();
    else alert("Delete failed");
  };

  // --- Record Management Logic ---
  const fetchRecords = () => {
    setLoading(true);
    fetch(`${API_BASE}/records/`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/records/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Creation Failed");
      }

      alert("Record created and System Synced!");
      fetchRecords();
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This triggers a system-wide sync.")) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/records/${id}/delete/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete Failed");
      fetchRecords();
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 32,
          gap: 24,
        }}
      >
        <div style={{ flex: 1 }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              background: "linear-gradient(to right, #F472B6, #FB7185)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: 8,
            }}
          >
            Admin Control Panel
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Manage database records and user roles.
          </p>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, paddingTop: 4 }}>
          <span
            style={{
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
            }}
          >
            Logged in as{" "}
            <b style={{ color: "var(--text-primary)" }}>{user.username}</b>
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <button
          onClick={() => setActiveTab("records")}
          style={activeTab === "records" ? activeTabStyle : tabStyle}
        >
          Crime Records
        </button>
        <button
          onClick={() => setActiveTab("users")}
          style={activeTab === "users" ? activeTabStyle : tabStyle}
        >
          User Management
        </button>
      </div>

      {activeTab === "records" ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 32 }}
        >
          {/* ... Existing Record Form & Table ... */}
          {/* Create Form */}
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: 24,
              borderRadius: 12,
              height: "fit-content",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: 16,
                borderBottom: "1px solid var(--border)",
                paddingBottom: 12,
              }}
            >
              Add New Record
            </h3>
            <form
              onSubmit={handleCreate}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: 4,
                  }}
                >
                  Year
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: parseInt(e.target.value) })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: 4,
                  }}
                >
                  Month (1-12)
                </label>
                <input
                  type="number"
                  value={formData.month}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      month: parseInt(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: 4,
                  }}
                >
                  District
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: 4,
                  }}
                >
                  Crime Type
                </label>
                <select
                  value={formData.crime_type}
                  onChange={(e) =>
                    setFormData({ ...formData, crime_type: e.target.value })
                  }
                  style={inputStyle}
                >
                  {["Total Crimes", "Theft", "Assault", "Drugs", "Robbery"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ),
                  )}
                </select>
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    marginBottom: 4,
                  }}
                >
                  Count
                </label>
                <input
                  type="number"
                  value={formData.crime_count}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      crime_count: parseInt(e.target.value),
                    })
                  }
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: "12px",
                  background: loading
                    ? "var(--text-secondary)"
                    : "var(--accent)",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: "bold",
                  cursor: loading ? "default" : "pointer",
                }}
              >
                {loading ? "Processing..." : "Create & Sync"}
              </button>
            </form>
          </div>

          {/* Data Table */}
          <div
            style={{
              background: "var(--bg-secondary)",
              padding: 24,
              borderRadius: 12,
              border: "1px solid var(--border)",
              overflowX: "auto",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Recent Records
            </h3>
            {records.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>
                No records found.
              </p>
            ) : (
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                  fontSize: "0.95rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <th style={{ padding: 12 }}>UniqID</th>
                    <th style={{ padding: 12 }}>Date</th>
                    <th style={{ padding: 12 }}>District</th>
                    <th style={{ padding: 12 }}>Crime Type</th>
                    <th style={{ padding: 12 }}>Count</th>
                    <th style={{ padding: 12 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <td
                        style={{ padding: 12, color: "var(--text-secondary)" }}
                      >
                        {r.id}
                      </td>
                      <td style={{ padding: 12 }}>
                        {r.year}-{String(r.month).padStart(2, "0")}
                      </td>
                      <td
                        style={{
                          padding: 12,
                          fontWeight: "500",
                          color: "#60A5FA",
                        }}
                      >
                        {r.district}
                      </td>
                      <td style={{ padding: 12 }}>{r.crime_type}</td>
                      <td style={{ padding: 12, fontWeight: "bold" }}>
                        {r.crime_count}
                      </td>
                      <td style={{ padding: 12 }}>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            background: "#EF4444",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-secondary)",
            padding: 24,
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ color: "var(--text-primary)", marginBottom: 16 }}>
            System Users
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                }}
              >
                <th style={{ padding: 12 }}>Username</th>
                <th style={{ padding: 12 }}>Role</th>
                <th style={{ padding: 12 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <td style={{ padding: 12 }}>
                    {u.username} {u.is_staff && " (Staff)"}
                  </td>
                  <td style={{ padding: 12 }}>
                    <select
                      value={u.role}
                      onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                      style={{
                        background: "var(--bg-tertiary)",
                        color: "var(--text-primary)",
                        padding: 6,
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                      }}
                    >
                      <option value="ADMIN">Administrator</option>
                      <option value="POLICE">Police Officer</option>
                      <option value="ANALYST">Analyst</option>
                      <option value="GUEST">Guest</option>
                    </select>
                  </td>
                  <td style={{ padding: 12 }}>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      style={{
                        color: "#EF4444",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const tabStyle = {
  padding: "10px 20px",
  background: "transparent",
  color: "var(--text-secondary)",
  border: "none",
  cursor: "pointer",
  fontSize: "1rem",
};
const activeTabStyle = {
  ...tabStyle,
  color: "#60A5FA",
  borderBottom: "2px solid #60A5FA",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  borderRadius: 6,
  outline: "none",
};
