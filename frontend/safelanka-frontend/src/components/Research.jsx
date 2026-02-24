import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import TopHighRiskDistricts from "./TopHighRiskDistricts";
import html2pdf from "html2pdf.js";

const API_BASE = "/api/analytics";
const CURRENT_YEAR = new Date().getFullYear();
const PREDICTED_YEAR = CURRENT_YEAR + 1;

export default function Research() {
  const [trends, setTrends] = useState([]);
  const [predictionData, setPredictionData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("1");
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Comparison State
  const [districts, setDistricts] = useState([]);
  const [d1, setD1] = useState("Colombo");
  const [d2, setD2] = useState("Gampaha");
  const [comparisonData, setComparisonData] = useState([]);
  const [summary, setSummary] = useState(null);

  // Load Initial Metadata
  useEffect(() => {
    fetch(`${API_BASE}/trends/`)
      .then((res) => res.json())
      .then(setTrends)
      .catch(console.error);

    fetch("/api/metadata/")
      .then((res) => res.json())
      .then((data) => {
        // Use administrative_districts instead of districts to get only the 25 official districts
        if (data.administrative_districts)
          setDistricts(data.administrative_districts);
      })
      .catch(console.error);
  }, []);

  // Fetch Prediction Data when month changes
  useEffect(() => {
    setLoadingPredictions(true);
    fetch(
      `/api/predict-risk-year-detailed/?year=${PREDICTED_YEAR}&crime_type=Total Crimes`,
    )
      .then((res) => res.json())
      .then((data) => {
        const monthData = data?.months?.[selectedMonth] || {};
        const normalized = {};

        Object.keys(monthData).forEach((district) => {
          const entry = monthData[district];
          normalized[district] = {
            risk: entry.risk_zone,
            count: entry.predicted_crime_count,
            trend: entry.trend || "stable",
          };
        });

        setPredictionData(normalized);
      })
      .catch(console.error)
      .finally(() => setLoadingPredictions(false));
  }, [selectedMonth]);

  // Fetch Comparison when selection changes
  useEffect(() => {
    if (!d1 || !d2) return;
    setLoadingComparison(true);
    fetch(`${API_BASE}/compare-districts/?district1=${d1}&district2=${d2}`)
      .then((res) => res.json())
      .then((data) => {
        setComparisonData(data.comparison_data);
        setSummary(data.summary);
      })
      .catch(console.error)
      .finally(() => setLoadingComparison(false));
  }, [d1, d2]);

  // Generate numbered filename with localStorage persistence
  const generateFilename = () => {
    const year = PREDICTED_YEAR;
    const month = String(selectedMonth).padStart(2, "0");
    const baseFilename = `SafeLanka_Report_${year}-${month}`;

    const storageKey = `report_counter_${year}_${month}`;
    const currentCount = parseInt(localStorage.getItem(storageKey) || "0", 10);

    let filename = baseFilename;
    if (currentCount > 0) {
      filename = `${baseFilename}(${currentCount + 1})`;
    }

    localStorage.setItem(storageKey, String(currentCount + 1));
    return filename;
  };

  // Component to render for PDF export
  const ReportContent = () => (
    <div
      style={{
        background: "#ffffff",
        color: "#111827",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {/* PDF Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            color: "#3B82F6",
            margin: 0,
          }}
        >
          SafeLanka – Research & Analytics Report
        </h1>
        <p style={{ color: "#6B7280", margin: "6px 0 0", fontSize: "0.85rem" }}>
          Generated: {new Date().toLocaleDateString()} | Period:{" "}
          {PREDICTED_YEAR}-{String(selectedMonth).padStart(2, "0")}
        </p>
      </div>

      {/* Top 5 High Risk Districts */}
      <div style={{ marginBottom: 16, pageBreakInside: "avoid" }}>
        {loadingPredictions ? (
          <div
            style={{
              background: "#ffffff",
              padding: 24,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              minHeight: 200,
            }}
          >
            <div style={{ position: "relative", width: 60, height: 60 }}>
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "3px solid transparent",
                  borderTopColor: "#3B82F6",
                  borderRightColor: "#60A5FA",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "1.2rem",
                }}
              >
                📊
              </div>
            </div>
            <div
              style={{
                color: "#3B82F6",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              Generating AI Forecast...
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : (
          <TopHighRiskDistricts
            data={predictionData}
            crimeType="Total Crimes"
          />
        )}
      </div>

      {/* National Trends - Compact */}
      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          marginBottom: 16,
          pageBreakInside: "avoid",
        }}
      >
        <h3
          style={{
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: 8,
            marginBottom: 12,
            fontSize: "1rem",
            fontWeight: "600",
            color: "#F472B6",
          }}
        >
          National Crime Trends (Monthly)
        </h3>

        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="label"
                stroke="#6B7280"
                fontSize={10}
                tickFormatter={(v) => v.slice(2)}
              />
              <YAxis stroke="#6B7280" fontSize={10} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}
                labelStyle={{ color: "#111827" }}
              />
              <Line
                type="monotone"
                dataKey="total_crime"
                stroke="#F472B6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* District Comparison - Compact */}
      <div
        style={{
          background: "#ffffff",
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          pageBreakInside: "avoid",
        }}
      >
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: "600",
            color: "#A78BFA",
            marginBottom: 12,
          }}
        >
          Comparative Analysis: {d1} vs {d2}
        </h3>

        {loadingComparison ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 280,
              gap: 12,
            }}
          >
            <div style={{ position: "relative", width: 50, height: 50 }}>
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  border: "3px solid transparent",
                  borderTopColor: "#A78BFA",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "1rem",
                }}
              >
                📈
              </div>
            </div>
            <div
              style={{
                color: "#A78BFA",
                fontSize: "0.9rem",
                fontWeight: "600",
              }}
            >
              Loading comparison data...
            </div>
          </div>
        ) : (
          <>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis dataKey="label" stroke="#6B7280" fontSize={10} />
                  <YAxis stroke="#6B7280" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                    }}
                  />
                  <Legend />
                  <Bar dataKey={d1} fill="#60A5FA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={d2} fill="#34D399" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {summary && (
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  gap: 24,
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: 16,
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#6B7280",
                    }}
                  >
                    Total {d1}
                  </span>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#60A5FA",
                    }}
                  >
                    {summary[d1]}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#6B7280",
                    }}
                  >
                    Total {d2}
                  </span>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#34D399",
                    }}
                  >
                    {summary[d2]}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      color: "#6B7280",
                    }}
                  >
                    Difference
                  </span>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: "bold",
                      color: "#111827",
                    }}
                  >
                    {summary.difference}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  const handleGenerateReport = async () => {
    let exportRoot = document.getElementById("pdf-export-root");
    if (!exportRoot) {
      exportRoot = document.createElement("div");
      exportRoot.id = "pdf-export-root";
      exportRoot.className = "pdf-export-root";
      exportRoot.style.position = "fixed";
      exportRoot.style.left = "-99999px";
      exportRoot.style.top = "0";
      exportRoot.style.background = "#ffffff";
      document.body.appendChild(exportRoot);
    }

    const reportContainer = document.createElement("div");
    reportContainer.style.width = "1123px";
    reportContainer.style.padding = "16px";
    reportContainer.style.background = "#ffffff";
    reportContainer.style.boxSizing = "border-box";
    reportContainer.style.overflow = "visible";
    exportRoot.appendChild(reportContainer);

    const root = createRoot(reportContainer);
    root.render(<ReportContent />);

    // wait for charts to fully render
    await new Promise((r) => setTimeout(r, 1000));
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    const filename = generateFilename();

    const options = {
      margin: 8,
      filename: `${filename}.pdf`,
      image: { type: "jpeg", quality: 0.95 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: reportContainer.scrollWidth,
        windowHeight: reportContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    try {
      await html2pdf().set(options).from(reportContainer).save();
    } finally {
      root.unmount();
      exportRoot.removeChild(reportContainer);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        background: "var(--bg-primary)",
        minHeight: "100vh",
        color: "var(--text-primary)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <header
        style={{
          marginBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
        className="no-print"
      >
        <div>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: "bold",
              background: "linear-gradient(to right, #60A5FA, #A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Research & Analytics Hub
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Deep dive into crime trends and model validation.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          style={{
            background: "#8B5CF6",
            color: "white",
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Generate Report
        </button>
      </header>

      {/* Top Row: Top 5 + Trends */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Left */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}
              >
                Viewing Month:
              </span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-primary)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    Month {m}
                  </option>
                ))}
              </select>
              <span
                style={{ fontSize: "0.85rem", color: "var(--text-tertiary)" }}
              >
                ({PREDICTED_YEAR})
              </span>
            </div>
          </div>

          <TopHighRiskDistricts
            data={predictionData}
            crimeType="Total Crimes"
          />
        </div>

        {/* Right */}
        <div
          className="report-card"
          style={{
            background: "var(--bg-secondary)",
            padding: 20,
            borderRadius: 12,
            border: "1px solid var(--border)",
          }}
        >
          <h3
            style={{
              borderBottom: "1px solid var(--border)",
              paddingBottom: 12,
              marginBottom: 16,
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#F472B6",
            }}
          >
            National Crime Trends (Monthly)
          </h3>

          <div style={{ height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="label"
                  stroke="var(--text-secondary)"
                  fontSize={12}
                  tickFormatter={(v) => v.slice(2)}
                />
                <YAxis stroke="var(--text-secondary)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                  }}
                  labelStyle={{ color: "var(--text-primary)" }}
                />
                <Line
                  type="monotone"
                  dataKey="total_crime"
                  stroke="#F472B6"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* District Comparison */}
      <div
        className="report-card"
        style={{
          background: "var(--bg-secondary)",
          padding: 20,
          borderRadius: 12,
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3
            style={{ fontSize: "1.1rem", fontWeight: "600", color: "#A78BFA" }}
          >
            Comparative Analysis
          </h3>

          <div style={{ display: "flex", gap: 12 }}>
            <select
              value={d1}
              onChange={(e) => setD1(e.target.value)}
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
              }}
            >
              {districts.map((d) => (
                <option key={`d1-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <span style={{ color: "var(--text-secondary)" }}>vs</span>

            <select
              value={d2}
              onChange={(e) => setD2(e.target.value)}
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
              }}
            >
              {districts.map((d) => (
                <option key={`d2-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis dataKey="label" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                cursor={{ fill: "var(--bg-tertiary)" }}
                contentStyle={{
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                }}
              />
              <Legend />
              <Bar dataKey={d1} fill="#60A5FA" radius={[4, 4, 0, 0]} />
              <Bar dataKey={d2} fill="#34D399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {summary && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 24,
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
            }}
          >
            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Total {d1}
              </span>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#60A5FA",
                }}
              >
                {summary[d1]}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Total {d2}
              </span>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "#34D399",
                }}
              >
                {summary[d2]}
              </span>
            </div>

            <div>
              <span
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "var(--text-secondary)",
                }}
              >
                Difference
              </span>
              <span
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--text-primary)",
                }}
              >
                {summary.difference}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
