import React from "react";

export default function SummaryCards({ data, mode }) {
  if (!data) return null;

  // Calculate statistics
  const districts = Object.keys(data);
  const totalDistricts = districts.length;

  let highRiskCount = 0;
  let totalCrimes = 0;

  districts.forEach((d) => {
    const entry = data[d];

    // Count high risk districts
    if (entry.risk === "High") highRiskCount++;

    // Sum total crime count
    totalCrimes += entry.count || 0;
  });

  const modeLabel = mode === "predicted" ? "AI Forecast" : "Historical Data";
  const dataSource = "Police Records";

  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: 16,
        }}
      >
        <StatCard
          title="Total Crimes"
          value={Math.round(totalCrimes)}
          color="#3B82F6"
          bgColor="rgba(59, 130, 246, 0.1)"
          borderColor="rgba(59, 130, 246, 0.3)"
        />

        <StatCard
          title="High Risk Districts"
          value={`${highRiskCount}`}
          subtitle={`out of ${totalDistricts}`}
          color="#EF4444"
          bgColor="rgba(239, 68, 68, 0.1)"
          borderColor="rgba(239, 68, 68, 0.3)"
        />

        <StatCard
          title="Mode"
          value={modeLabel}
          color="#8B5CF6"
          bgColor="rgba(139, 92, 246, 0.1)"
          borderColor="rgba(139, 92, 246, 0.3)"
          isText={true}
        />

        <StatCard
          title="Data Source"
          value={dataSource}
          color="#10B981"
          bgColor="rgba(16, 185, 129, 0.1)"
          borderColor="rgba(16, 185, 129, 0.3)"
          isText={true}
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
  bgColor,
  borderColor,
  isText,
}) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        padding: 24,
        borderRadius: 12,
        border: `1px solid ${borderColor}`,
        borderLeft: `4px solid ${color}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
          marginBottom: 12,
          fontWeight: "500",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: isText ? "1.5rem" : "2.5rem",
          fontWeight: "bold",
          color: color,
          lineHeight: 1.2,
          marginBottom: subtitle ? 8 : 0,
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--text-tertiary)",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
