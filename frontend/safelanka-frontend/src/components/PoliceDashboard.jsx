import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const API_BASE = "/api/police";

// Helper function to calculate patrol recommendations
const calculatePatrolRecommendation = (risk, trend, predicted_count) => {
  let intensity = "Standard";
  let units = 1;

  // Rule logic
  if (risk === "High" && trend === "Increasing") {
    intensity = "High";
    units = 3;
  } else if (risk === "High" && trend === "Stable") {
    intensity = "High";
    units = 2;
  } else if (risk === "Medium" && trend === "Increasing") {
    intensity = "Standard+";
    units = 2;
  } else if (risk === "Medium" && trend === "Stable") {
    intensity = "Standard";
    units = 1;
  } else if (risk === "Low" && trend === "Decreasing") {
    intensity = "Low";
    units = 1;
  }

  // Calculate priority score (0-100)
  let score = 0;

  // Base risk score
  if (risk === "High") score += 70;
  else if (risk === "Medium") score += 40;
  else if (risk === "Low") score += 15;

  // Trend adjustment
  if (trend === "Increasing") score += 15;
  else if (trend === "Stable") score += 5;
  else if (trend === "Decreasing") score -= 5;

  // Predicted count adjustment (normalized 0-10)
  const countBonus = Math.min(10, predicted_count / 20);
  score += countBonus;

  // Clamp score 0-100
  score = Math.max(0, Math.min(100, score));

  return { intensity, units, score: Math.round(score) };
};

// Recommendation Panel Component
const RecommendationPanel = ({ riskData, recommendation }) => {
  if (!riskData || !recommendation) {
    return (
      <div style={panelStyle}>
        <div
          style={{
            textAlign: "center",
            color: "var(--text-secondary)",
            padding: "20px 0",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: 8 }}>⏳</div>
          <p>Loading risk assessment...</p>
        </div>
      </div>
    );
  }

  const { risk, predicted_count, trend, top_crime_types } = riskData;
  const { intensity, units, score } = recommendation;

  // Risk badge color
  const riskColors = {
    High: { bg: "#FEE2E2", text: "#DC2626", border: "#EF4444" },
    Medium: { bg: "#FEF3C7", text: "#D97706", border: "#F59E0B" },
    Low: { bg: "#D1FAE5", text: "#059669", border: "#10B981" },
  };

  const riskColor = riskColors[risk] || riskColors.Low;

  // Trend icon
  const trendIcons = {
    Increasing: "↑",
    Stable: "→",
    Decreasing: "↓",
  };

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h4
          style={{ margin: 0, color: "var(--text-primary)", fontSize: "1rem" }}
        >
          🎯 AI Patrol Recommendation
        </h4>
        <div
          style={{
            ...riskBadgeStyle,
            background: riskColor.bg,
            color: riskColor.text,
            border: `1px solid ${riskColor.border}`,
          }}
        >
          {risk} Risk
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={statCardStyle}>
          <div style={statLabelStyle}>Predicted Crimes</div>
          <div style={statValueStyle}>{predicted_count.toFixed(1)}</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Trend</div>
          <div
            style={{
              ...statValueStyle,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>{trendIcons[trend]}</span>
            {trend}
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Intensity</div>
          <div style={statValueStyle}>{intensity}</div>
        </div>

        <div style={statCardStyle}>
          <div style={statLabelStyle}>Suggested Units</div>
          <div style={statValueStyle}>
            {units} Patrol{units > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Priority Score */}
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Priority Score
          </span>
          <span
            style={{
              fontSize: "0.85rem",
              fontWeight: "bold",
              color: "var(--text-primary)",
            }}
          >
            {score}/100
          </span>
        </div>
        <div style={progressBarBgStyle}>
          <div
            style={{
              ...progressBarFillStyle,
              width: `${score}%`,
              background:
                score >= 70 ? "#EF4444" : score >= 40 ? "#F59E0B" : "#10B981",
            }}
          />
        </div>
      </div>

      {/* Crime Focus */}
      {top_crime_types && top_crime_types.length > 0 && (
        <div
          style={{
            background: "var(--bg-tertiary)",
            padding: 12,
            borderRadius: 6,
            borderLeft: "3px solid #3B82F6",
          }}
        >
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            🔍 Focus Areas
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {top_crime_types.join(", ")}
          </div>
        </div>
      )}

      {/* Recommendation Message */}
      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: "rgba(59, 130, 246, 0.1)",
          border: "1px solid rgba(59, 130, 246, 0.3)",
          borderRadius: 6,
          fontSize: "0.9rem",
          color: "var(--text-primary)",
          lineHeight: 1.5,
        }}
      >
        <strong>
          {risk} Risk ({trend}).
        </strong>{" "}
        Recommended: Deploy{" "}
        <strong>
          {units} patrol unit{units > 1 ? "s" : ""}
        </strong>
        .
        {top_crime_types && top_crime_types.length > 0 && (
          <>
            {" "}
            Focus on <strong>{top_crime_types.join(" and ")}</strong> hotspots.
          </>
        )}{" "}
        Priority Score: <strong>{score}/100</strong>
      </div>
    </div>
  );
};

export default function PoliceDashboard() {
  const { user } = useAuth();
  const [patrols, setPatrols] = useState([]);
  const [formData, setFormData] = useState({
    district: "Colombo",
    date: "",
    shift: "Morning",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which patrol is being updated

  // Risk recommendation state
  const [riskData, setRiskData] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  // Get user role
  const userRole = user?.profile?.role || (user?.is_staff ? "ADMIN" : null);

  useEffect(() => {
    fetchPatrols();
  }, []);

  // Fetch risk assessment when district, date, or shift changes
  useEffect(() => {
    const fetchRiskAssessment = async () => {
      // Only fetch if we have both district and date
      if (!formData.district || !formData.date) {
        setRiskData(null);
        setRecommendation(null);
        return;
      }

      setLoadingRisk(true);
      try {
        const response = await fetch(
          `/api/predict-risk/?district=${encodeURIComponent(formData.district)}&date=${formData.date}`,
        );

        if (response.ok) {
          const data = await response.json();
          setRiskData(data);

          // Calculate recommendation
          const rec = calculatePatrolRecommendation(
            data.risk,
            data.trend,
            data.predicted_count,
          );
          setRecommendation(rec);
        } else {
          console.error("Failed to fetch risk assessment");
          setRiskData(null);
          setRecommendation(null);
        }
      } catch (error) {
        console.error("Error fetching risk assessment:", error);
        setRiskData(null);
        setRecommendation(null);
      } finally {
        setLoadingRisk(false);
      }
    };

    fetchRiskAssessment();
  }, [formData.district, formData.date, formData.shift]);

  const fetchPatrols = () => {
    fetch(`${API_BASE}/patrols/`)
      .then((res) => res.json())
      .then(setPatrols)
      .catch(console.error);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const loadingToast = toast.loading("Scheduling patrol...");
    
    try {
      const res = await fetch(`${API_BASE}/patrols/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      if (res.ok) {
        toast.dismiss(loadingToast);
        const data = await res.json();
        toast.success(`🚔 Patrol scheduled successfully for ${formData.district}!`, {
          duration: 4000,
        });
        fetchPatrols();
        // Reset form
        setFormData({
          district: "",
          date: "",
          shift: "Morning",
          units: 1,
          notes: "",
        });
      } else {
        toast.dismiss(loadingToast);
        const error = await res.json();
        toast.error(error.error || "Failed to schedule patrol. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (patrolId, newStatus) => {
    if (
      !window.confirm(`Are you sure you want to change status to ${newStatus}?`)
    ) {
      return;
    }

    setUpdatingStatus(patrolId);
    const loadingToast = toast.loading(`Updating patrol status to ${newStatus}...`);
    
    try {
      const res = await fetch(`${API_BASE}/patrols/${patrolId}/status/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });

      if (res.ok) {
        toast.dismiss(loadingToast);
        const statusEmojis = {
          ACTIVE: "✅",
          COMPLETED: "🏁",
          CANCELLED: "❌",
        };
        toast.success(
          `${statusEmojis[newStatus] || "📝"} Patrol status updated to ${newStatus}`,
          { duration: 3000 }
        );
        fetchPatrols();
      } else {
        toast.dismiss(loadingToast);
        const error = await res.json();
        toast.error(`Failed to update status: ${error.error || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error("Error updating patrol status. Please try again.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Helper function to check if patrol should be active based on time
  const getSuggestedAction = (patrol) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentHour = now.getHours();

    if (patrol.date !== today || patrol.status !== "PLANNED") {
      return null;
    }

    // Check if current time is within shift range
    const shiftRanges = {
      Morning: { start: 6, end: 14 },
      Evening: { start: 14, end: 22 },
      Night: { start: 22, end: 6 }, // Night wraps around midnight
    };

    const range = shiftRanges[patrol.shift];
    if (!range) return null;

    if (patrol.shift === "Night") {
      if (currentHour >= range.start || currentHour < range.end) {
        return "START_NOW";
      }
    } else {
      if (currentHour >= range.start && currentHour < range.end) {
        return "START_NOW";
      }
    }

    return null;
  };

  // Helper function to check if active patrol should be completed
  const shouldSuggestComplete = (patrol) => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const currentHour = now.getHours();

    if (patrol.date !== today || patrol.status !== "ACTIVE") {
      return false;
    }

    const shiftRanges = {
      Morning: { end: 14 },
      Evening: { end: 22 },
      Night: { end: 6 },
    };

    const range = shiftRanges[patrol.shift];
    if (!range) return false;

    // For night shift, check if it's past 6 AM
    if (patrol.shift === "Night") {
      return currentHour >= range.end && currentHour < 12;
    }

    // For other shifts, check if past end time
    return currentHour >= range.end;
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

  return (
    <div style={{ padding: 24, paddingBottom: 60 }}>
      <h1
        style={{
          fontSize: "2rem",
          fontWeight: "bold",
          background: "linear-gradient(to right, #60A5FA, #3B82F6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 8,
        }}
      >
        Police Operations Center
      </h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: 32 }}>
        Plan patrols based on AI risk assessments.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 32 }}>
        <div
          style={{
            background: "var(--bg-secondary)",
            padding: 24,
            borderRadius: 12,
            height: "fit-content",
          }}
        >
          <h3 style={{ color: "var(--text-primary)", marginBottom: 16 }}>
            Schedule Patrol
          </h3>
          <form
            onSubmit={handleCreate}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              style={inputStyle}
            />
            <select
              value={formData.district}
              onChange={(e) =>
                setFormData({ ...formData, district: e.target.value })
              }
              style={inputStyle}
            >
              {[
                "Ampara",
                "Anuradhapura",
                "Badulla",
                "Batticaloa",
                "Colombo",
                "Galle",
                "Gampaha",
                "Hambantota",
                "Jaffna",
                "Kalutara",
                "Kandy",
                "Kegalle",
                "Kilinochchi",
                "Kurunegala",
                "Mannar",
                "Matale",
                "Matara",
                "Monaragala",
                "Mullaitivu",
                "Nuwara Eliya",
                "Polonnaruwa",
                "Puttalam",
                "Ratnapura",
                "Trincomalee",
                "Vavuniya",
              ].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={formData.shift}
              onChange={(e) =>
                setFormData({ ...formData, shift: e.target.value })
              }
              style={inputStyle}
            >
              <option value="Morning">Morning (06:00 - 14:00)</option>
              <option value="Evening">Evening (14:00 - 22:00)</option>
              <option value="Night">Night (22:00 - 06:00)</option>
            </select>
            <textarea
              placeholder="Operational Notes..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              style={{ ...inputStyle, minHeight: 80 }}
            />

            {/* Risk-Based Recommendation Panel */}
            {formData.date && (
              <RecommendationPanel
                riskData={riskData}
                recommendation={recommendation}
              />
            )}

            <button
              type="submit"
              disabled={loading || loadingRisk || !formData.date || !riskData}
              style={{
                ...btnStyle,
                opacity:
                  loading || loadingRisk || !formData.date || !riskData
                    ? 0.5
                    : 1,
                cursor:
                  loading || loadingRisk || !formData.date || !riskData
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {loading
                ? "Scheduling..."
                : loadingRisk
                  ? "Analyzing Risk..."
                  : "Deploy Patrol"}
            </button>
          </form>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            padding: 24,
            borderRadius: 12,
          }}
        >
          <h3 style={{ color: "var(--text-primary)", marginBottom: 16 }}>
            Upcoming Patrols
          </h3>
          {patrols.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>
              No patrols scheduled.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {patrols.map((p) => {
                const suggestedAction = getSuggestedAction(p);
                const suggestComplete = shouldSuggestComplete(p);

                // Status badge styling
                const statusStyles = {
                  PLANNED: {
                    bg: "#DBEAFE",
                    text: "#1E40AF",
                    border: "#3B82F6",
                  },
                  ACTIVE: { bg: "#D1FAE5", text: "#065F46", border: "#10B981" },
                  COMPLETED: {
                    bg: "#F3F4F6",
                    text: "#4B5563",
                    border: "#9CA3AF",
                  },
                  CANCELLED: {
                    bg: "#FEE2E2",
                    text: "#991B1B",
                    border: "#EF4444",
                  },
                };

                const statusStyle =
                  statusStyles[p.status] || statusStyles.PLANNED;

                return (
                  <div
                    key={p.id}
                    style={{
                      background: "var(--bg-primary)",
                      padding: 16,
                      borderRadius: 8,
                      borderLeft: `4px solid ${statusStyle.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "bold",
                            color: "var(--text-primary)",
                          }}
                        >
                          {p.district}{" "}
                          <span
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                              fontWeight: "normal",
                            }}
                          >
                            ({p.date} - {p.shift})
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "0.9rem",
                            color: "var(--text-secondary)",
                          }}
                        >
                          Officer: {p.officer_name}
                        </div>
                        {p.notes && (
                          <div
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                              marginTop: 4,
                              fontStyle: "italic",
                            }}
                          >
                            "{p.notes}"
                          </div>
                        )}

                        {/* Time-based suggestions */}
                        {suggestedAction === "START_NOW" && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#059669",
                              marginTop: 6,
                              background: "#D1FAE5",
                              padding: "4px 8px",
                              borderRadius: 4,
                              display: "inline-block",
                            }}
                          >
                            ⏰ Shift is active now - Ready to start
                          </div>
                        )}
                        {suggestComplete && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "#D97706",
                              marginTop: 6,
                              background: "#FEF3C7",
                              padding: "4px 8px",
                              borderRadius: 4,
                              display: "inline-block",
                            }}
                          >
                            ⚠️ Shift ended - Consider marking complete
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                          padding: "4px 10px",
                          borderRadius: 4,
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          whiteSpace: "nowrap",
                          marginLeft: 12,
                        }}
                      >
                        {p.status}
                      </div>
                    </div>

                    {/* Action buttons based on role and status */}
                    {(userRole === "SUPERVISOR" || userRole === "ADMIN") && (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexWrap: "wrap",
                          marginTop: 12,
                        }}
                      >
                        {p.status === "PLANNED" && (
                          <button
                            onClick={() => handleStatusUpdate(p.id, "ACTIVE")}
                            disabled={updatingStatus === p.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 4,
                              background: "#10B981",
                              color: "white",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === p.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: updatingStatus === p.id ? 0.6 : 1,
                            }}
                          >
                            {updatingStatus === p.id
                              ? "Updating..."
                              : "▶ Start Patrol"}
                          </button>
                        )}

                        {p.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(p.id, "COMPLETED")
                            }
                            disabled={updatingStatus === p.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 4,
                              background: "#6B7280",
                              color: "white",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === p.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: updatingStatus === p.id ? 0.6 : 1,
                            }}
                          >
                            {updatingStatus === p.id
                              ? "Updating..."
                              : "✓ Mark Complete"}
                          </button>
                        )}

                        {(p.status === "PLANNED" || p.status === "ACTIVE") && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(p.id, "CANCELLED")
                            }
                            disabled={updatingStatus === p.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 4,
                              background: "#EF4444",
                              color: "white",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              cursor:
                                updatingStatus === p.id
                                  ? "not-allowed"
                                  : "pointer",
                              opacity: updatingStatus === p.id ? 0.6 : 1,
                            }}
                          >
                            {updatingStatus === p.id
                              ? "Updating..."
                              : "✕ Cancel"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Officer view (read-only) */}
                    {userRole === "OFFICER" && p.status === "ACTIVE" && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginTop: 8,
                          fontStyle: "italic",
                        }}
                      >
                        💼 On active duty - Contact supervisor to update status
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 10,
  borderRadius: 6,
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  color: "var(--text-primary)",
  outline: "none",
};
const btnStyle = {
  padding: 12,
  borderRadius: 6,
  background: "var(--accent)",
  color: "white",
  border: "none",
  fontWeight: "bold",
  cursor: "pointer",
};

// Recommendation Panel Styles
const panelStyle = {
  background:
    "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: 8,
  padding: 16,
  marginTop: 8,
};
const riskBadgeStyle = {
  padding: "4px 12px",
  borderRadius: 6,
  fontSize: "0.75rem",
  fontWeight: 600,
  display: "inline-block",
  marginBottom: 12,
};
const statCardStyle = {
  background: "var(--bg-primary)",
  padding: 12,
  borderRadius: 6,
  border: "1px solid var(--border)",
};
const statLabelStyle = {
  fontSize: "0.75rem",
  color: "var(--text-secondary)",
  marginBottom: 4,
};
const statValueStyle = {
  fontSize: "1.25rem",
  fontWeight: "bold",
  color: "var(--text-primary)",
};
const progressBarBgStyle = {
  width: "100%",
  height: 8,
  background: "var(--bg-primary)",
  borderRadius: 4,
  overflow: "hidden",
};
const progressBarFillStyle = (width, color) => ({
  height: "100%",
  width: `${width}%`,
  background: color,
  transition: "width 0.3s ease",
});
