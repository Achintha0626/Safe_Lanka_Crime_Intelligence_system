import { useMemo } from "react";

export default function TopHighRiskDistricts({ data, crimeType }) {
  // Transform data object to array and filter/sort for top 5 high-risk districts
  const topHighRisk = useMemo(() => {
    if (!data) return [];

    // Convert object to array
    const dataArray = Object.entries(data).map(([district, info]) => ({
      district,
      crime_type: crimeType || "N/A",
      predicted_count: info.count || 0,
      risk_zone: info.risk || "Low",
      trend: info.trend || "stable",
    }));

    // Filter high-risk only
    const highRiskOnly = dataArray.filter((item) => item.risk_zone === "High");

    // Sort by predicted_count descending
    highRiskOnly.sort((a, b) => b.predicted_count - a.predicted_count);

    // Take top 5
    return highRiskOnly.slice(0, 5);
  }, [data, crimeType]);

  // Helper function for trend icon and color
  const getTrendDisplay = (trend) => {
    const trendLower = trend.toLowerCase();

    if (trendLower === "increasing") {
      return { icon: "↑", color: "#EF4444", label: "Increasing" };
    } else if (trendLower === "decreasing") {
      return { icon: "↓", color: "#10B981", label: "Decreasing" };
    } else {
      return { icon: "→", color: "#F59E0B", label: "Stable" };
    }
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        padding: 20,
        borderRadius: 12,
        border: "1px solid var(--border)",
        marginBottom: 24,
      }}
    >
      <h3
        style={{
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#60A5FA",
          margin: "0 0 16px 0",
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        Top 5 Predicted High-Risk Districts
      </h3>

      {topHighRisk.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ opacity: 0.5, marginBottom: 8 }}
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p style={{ fontSize: "0.95rem", margin: 0 }}>
            No high-risk districts for the selected period.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                <th style={{ ...headerStyle, width: "60px" }}>Rank</th>
                <th style={{ ...headerStyle, textAlign: "left" }}>District</th>
                <th style={{ ...headerStyle, textAlign: "left" }}>
                  Crime Type
                </th>
                <th style={{ ...headerStyle, textAlign: "right" }}>
                  Predicted Count
                </th>
                <th
                  style={{
                    ...headerStyle,
                    textAlign: "center",
                    width: "120px",
                  }}
                >
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {topHighRisk.map((item, index) => {
                const trendDisplay = getTrendDisplay(item.trend);
                return (
                  <tr
                    key={item.district}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--bg-tertiary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background:
                            index === 0 ? "#EF4444" : "var(--bg-tertiary)",
                          color: index === 0 ? "#FFF" : "var(--text-secondary)",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                        }}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        fontWeight: "500",
                        color: "var(--text-primary)",
                      }}
                    >
                      {item.district}
                    </td>
                    <td
                      style={{ ...cellStyle, color: "var(--text-secondary)" }}
                    >
                      {item.crime_type}
                    </td>
                    <td
                      style={{
                        ...cellStyle,
                        textAlign: "right",
                        fontWeight: "bold",
                        color: "#60A5FA",
                      }}
                    >
                      {item.predicted_count.toFixed(2)}
                    </td>
                    <td style={{ ...cellStyle, textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: `${trendDisplay.color}20`,
                          color: trendDisplay.color,
                          fontSize: "0.85rem",
                          fontWeight: "500",
                        }}
                      >
                        <span style={{ fontSize: "1.1rem" }}>
                          {trendDisplay.icon}
                        </span>
                        {trendDisplay.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const headerStyle = {
  padding: "12px 16px",
  color: "var(--text-secondary)",
  fontWeight: "600",
  fontSize: "0.8rem",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const cellStyle = {
  padding: "14px 16px",
  color: "var(--text-primary)",
};
