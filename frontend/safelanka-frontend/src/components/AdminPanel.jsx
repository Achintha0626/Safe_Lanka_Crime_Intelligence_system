import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

  // Metadata State
  const [districts, setDistricts] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMetadata();
    fetchRecords();
    if (activeTab === "users") fetchUsers();
  }, [user, navigate, activeTab]);

  const fetchMetadata = () => {
    fetch("/api/metadata/")
      .then((res) => res.json())
      .then((meta) => {
        setDistricts(meta.administrative_districts || []);
        setCrimeTypes(meta.crime_types || []);
      })
      .catch(console.error);
  };

  // Update form defaults when metadata loads
  useEffect(() => {
    if (districts.length > 0 && crimeTypes.length > 0) {
      // Set defaults if current values are not in the lists
      if (!districts.includes(formData.district)) {
        setFormData((prev) => ({ ...prev, district: districts[0] }));
      }
      if (!crimeTypes.includes(formData.crime_type)) {
        setFormData((prev) => ({ ...prev, crime_type: crimeTypes[0] }));
      }
    }
  }, [districts, crimeTypes]);

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
    if (res.ok) {
      toast.success("User role updated successfully!");
      fetchUsers();
    } else {
      toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete this user?")) return;
    const loadingToast = toast.loading("Deleting user...");
    const res = await fetch(`${API_BASE}/users/${userId}/delete/`, {
      method: "DELETE",
      headers: { "X-CSRFToken": getCookie("csrftoken") },
      credentials: "include",
    });
    if (res.ok) {
      toast.success("User deleted successfully!", { id: loadingToast });
      fetchUsers();
    } else {
      toast.error("Failed to delete user", { id: loadingToast });
    }
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

    // Show loading toast
    const loadingToast = toast.loading("Creating record and syncing data...");

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

      // Success!
      toast.success("Record created and system synced successfully!", {
        id: loadingToast,
      });
      fetchRecords();
    } catch (err) {
      toast.error("Error: " + err.message, {
        id: loadingToast,
      });
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This triggers a system-wide sync.")) return;
    setLoading(true);
    const loadingToast = toast.loading("Deleting record and syncing...");

    try {
      const res = await fetch(`${API_BASE}/records/${id}/delete/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Delete Failed");

      toast.success("Record deleted successfully!", {
        id: loadingToast,
      });
      fetchRecords();
    } catch (err) {
      toast.error("Error: " + err.message, {
        id: loadingToast,
      });
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1200,
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Loading Overlay */}
      {loading && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              border: "4px solid rgba(96, 165, 250, 0.3)",
              borderTop: "4px solid #60A5FA",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <p
            style={{
              color: "white",
              marginTop: 20,
              fontSize: "1.1rem",
              fontWeight: "500",
            }}
          >
            Processing...
          </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

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
                <select
                  value={formData.district}
                  onChange={(e) =>
                    setFormData({ ...formData, district: e.target.value })
                  }
                  style={inputStyle}
                >
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
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
                  Crime Type
                </label>
                <select
                  value={formData.crime_type}
                  onChange={(e) =>
                    setFormData({ ...formData, crime_type: e.target.value })
                  }
                  style={inputStyle}
                >
                  {crimeTypes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
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
