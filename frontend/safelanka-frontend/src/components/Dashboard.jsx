import { useEffect, useState, useMemo } from "react";
import SriLankaHeatmap from "./SriLankaHeatmap";
import SummaryCards from "./SummaryCards";
import { fetchPredictedRiskYearDetailed } from "../services/crimeService";
import { useAuth } from "../context/AuthContext";

const API_BASE = "/api";
const CURRENT_YEAR = new Date().getFullYear();
const PREDICTED_YEAR = String(CURRENT_YEAR + 1);

export default function Dashboard() {
  const { user } = useAuth();

  // Metadata
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);

  // Filters
  const [mode, setMode] = useState("historical"); // historical | predicted
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [crimeType, setCrimeType] = useState("");

  // Data State
  const [dashboardData, setDashboardData] = useState(null); // Normalized { district: { risk, count, explanation } }
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load Metadata
  useEffect(() => {
    fetch(`${API_BASE}/metadata/`)
      .then((res) => res.json())
      .then((meta) => {
        setYears(meta.years || []);
        setMonths(meta.months || []);
        setCrimeTypes(meta.crime_types || []);

        // Defaults
        if (meta.years?.length)
          setYear(String(meta.years[meta.years.length - 1])); // Default to latest historical
        if (meta.months?.length) setMonth(String(meta.months[0]));
        if (meta.crime_types?.length) setCrimeType(meta.crime_types[0]);
      })
      .catch(console.error);
  }, []);

  // Sync Year with Mode
  useEffect(() => {
    if (mode === "predicted") {
      setYear(PREDICTED_YEAR); // Or fetch available predicted years? Hardcoded for now based on prompt logic
    } else {
      // If switching back to historical, maybe checking if current year is valid?
      // We leave it as is or reset to last known historical.
      if (years.length && (!year || year === PREDICTED_YEAR)) {
        setYear(String(years[years.length - 1]));
      }
    }
  }, [mode, years]);

  // Fetch Data
  useEffect(() => {
    if (!year || !month || !crimeType) return;

    setLoading(true);

    async function fetchData() {
      try {
        if (mode === "predicted") {
          const data = await fetchPredictedRiskYearDetailed(
            parseInt(year),
            crimeType,
          );
          // Normalize
          // Response: { months: { "1": { District: { predicted_crime_count, risk_zone, explanation } } } }
          const monthData = data?.months?.[String(month)] || {};

          const normalized = {};
          Object.keys(monthData).forEach((d) => {
            const entry = monthData[d];
            normalized[d] = {
              risk: entry.risk_zone,
              count: entry.predicted_crime_count,
              explanation: entry.explanation,
              trend: entry.trend || "stable",
            };
          });
          setDashboardData(normalized);
          setDataVersion((v) => v + 1);
        } else {
          // Historical: Need Risk AND Counts
          const [riskRes, countRes] = await Promise.all([
            fetch(
              `${API_BASE}/risk-by-district/?year=${year}&month=${month}&crime_type=${crimeType}`,
            ),
            fetch(
              `${API_BASE}/crime-count-by-district/?year=${year}&month=${month}&crime_type=${crimeType}`,
            ),
          ]);

          const riskData = await riskRes.json(); // { District: Risk }
          const countData = await countRes.json(); // { District: Count }

          // Merge
          const normalized = {};
          // Union of keys
          const allDistricts = new Set([
            ...Object.keys(riskData),
            ...Object.keys(countData),
          ]);
          allDistricts.forEach((d) => {
            normalized[d] = {
              risk: riskData[d] || "Low",
              count: countData[d] || 0,
              explanation: null,
              trend: "stable", // Historical data doesn't have trend info
            };
          });
          setDashboardData(normalized);
          setDataVersion((v) => v + 1);
        }
      } catch (err) {
        console.error(err);
        setDashboardData({});
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [mode, year, month, crimeType]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      {/* Header & Filters */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "end",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: "bold",
              background: "linear-gradient(to right, #60A5FA, #3B82F6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              margin: 0,
            }}
          >
            Crime Risk Dashboard
          </h1>
          <p style={{ color: "var(--text-secondary)", margin: "4px 0 0" }}>
            Real-time analysis and AI forecasting.
          </p>
        </div>

        {/* Unified Filter Bar */}
        <div
          style={{
            display: "flex",
            gap: 12,
            background: "var(--bg-secondary)",
            padding: "8px 16px",
            borderRadius: 12,
            border: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          <FilterSelect
            label="Mode"
            value={mode}
            onChange={setMode}
            options={
              user && user.role !== "GUEST"
                ? [
                    { value: "historical", label: "Historical" },
                    { value: "predicted", label: "AI Forecast" },
                  ]
                : [{ value: "historical", label: "Historical" }]
            }
          />

          <FilterSelect
            label="Year"
            value={year}
            onChange={setYear}
            options={
              mode === "predicted"
                ? [{ value: PREDICTED_YEAR, label: PREDICTED_YEAR }]
                : years.map((y) => ({ value: y, label: y }))
            }
          />

          <FilterSelect
            label="Month"
            value={month}
            onChange={setMonth}
            options={months.map((m) => ({ value: m, label: m }))}
          />

          <FilterSelect
            label="Crime Type"
            value={crimeType}
            onChange={setCrimeType}
            options={crimeTypes.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 16,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-secondary)",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "60%",
                    height: 12,
                    background: "var(--bg-tertiary)",
                    borderRadius: 4,
                    marginBottom: 16,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <div
                  style={{
                    width: "40%",
                    height: 32,
                    background: "var(--bg-tertiary)",
                    borderRadius: 4,
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
                <style>{`
                  @keyframes pulse {
                    0%, 100% { opacity: 0.4; }
                    50% { opacity: 0.8; }
                  }
                `}</style>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <SummaryCards data={dashboardData} mode={mode} />
      )}

      <div
        style={{
          background: "var(--bg-secondary)",
          padding: 8,
          borderRadius: 16,
          border: "1px solid var(--border)",
          position: "relative",
          minHeight: 600,
        }}
      >
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.95)",
              backdropFilter: "blur(8px)",
              zIndex: 10,
              borderRadius: 16,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <div style={{ position: "relative", width: 80, height: 80 }}>
              {/* Outer spinning ring */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "4px solid transparent",
                  borderTopColor: "#3B82F6",
                  borderRightColor: "#60A5FA",
                  borderRadius: "50%",
                  animation: "spin 1.2s linear infinite",
                }}
              />
              {/* Inner spinning ring */}
              <div
                style={{
                  position: "absolute",
                  width: "70%",
                  height: "70%",
                  top: "15%",
                  left: "15%",
                  border: "3px solid transparent",
                  borderBottomColor: "#3B82F6",
                  borderLeftColor: "#60A5FA",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite reverse",
                }}
              />
              {/* Center icon */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "1.5rem",
                }}
              >
                🔄
              </div>
            </div>
            <div
              style={{
                color: "#60A5FA",
                fontSize: "1.1rem",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              {mode === "predicted"
                ? "Generating AI Forecast..."
                : "Loading Data..."}
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
              }}
            >
              Analyzing crime patterns across districts
            </div>
            {/* Add keyframes animation */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}
        <SriLankaHeatmap
          mode={mode}
          year={year}
          month={month}
          crimeType={crimeType}
          data={dashboardData}
          dataVersion={dataVersion}
        />
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--bg-tertiary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border)",
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: "0.9rem",
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
