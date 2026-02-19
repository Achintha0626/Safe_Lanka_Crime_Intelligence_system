import { Link } from "react-router-dom";
import SriLankaHeatmap from "./SriLankaHeatmap";

export default function LandingPage() {
  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", color: "white", fontFamily: "Inter, sans-serif" }}>
      
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 40px", position: "relative", zIndex: 10 }}>
        <div style={{ fontSize: "1.5rem", fontWeight: "800", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#3B82F6" }}>🛡️</span> SafeLanka
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: "0.95rem", color: "#9CA3AF" }}>
            <span style={{ cursor: "pointer", color: "white" }}>Dashboard</span>
            <span style={{ cursor: "pointer" }}>Analytics</span>
            <span style={{ cursor: "pointer" }}>Intelligence</span>
            <span style={{ cursor: "pointer" }}>Resources</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
            <button style={{ background: "#EF4444", color: "white", padding: "8px 16px", borderRadius: 6, fontWeight: "bold", border: "none", cursor: "pointer" }}>
                ⚠️ EMERGENCY
            </button>
            <Link to="/login">
                <button style={{ background: "#1F2937", color: "white", padding: "8px 20px", borderRadius: 6, border: "1px solid #374151", cursor: "pointer" }}>
                    Login
                </button>
            </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div style={{ position: "relative", height: "600px", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginTop: 20 }}>
          {/* Map Background with Overlay */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.4, filter: "grayscale(100%) invert(100%)" }}>
             {/* We can re-use the heatmap here purely visually with dummy data or just empty to show the map */}
             <SriLankaHeatmap mode="historical" year="2024" month="1" crimeType="Total" data={{}} />
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #0F172A 0%, transparent 50%, #0F172A 100%)" }}></div>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, transparent 0%, #0F172A 80%)" }}></div>

          {/* Hero Content */}
          <div style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: 800, padding: 20 }}>
              <div style={{ marginBottom: 16, display: "inline-block", background: "rgba(59, 130, 246, 0.2)", color: "#60A5FA", padding: "4px 12px", borderRadius: 20, fontSize: "0.85rem", fontWeight: "600" }}>
                  ● LIVE NATIONAL SURVEILLANCE ACTIVE
              </div>
              <h1 style={{ fontSize: "4rem", fontWeight: "900", lineHeight: 1.1, marginBottom: 24, background: "linear-gradient(to right, #FFFFFF, #94A3B8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  Securing the Nation <br/> Through <span style={{ color: "#3B82F6", WebkitTextFillColor: "#3B82F6" }}>Intelligence</span>
              </h1>
              <p style={{ fontSize: "1.2rem", color: "#9CA3AF", marginBottom: 32, lineHeight: 1.6 }}>
                  Advanced crime monitoring and predictive analytics for a safer Sri Lanka. 
                  We provide law enforcement with real-time actionable data and high-accuracy threat assessment.
              </p>
              <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
                  <button style={{ background: "#3B82F6", color: "white", padding: "14px 32px", borderRadius: 8, fontSize: "1rem", fontWeight: "bold", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>
                      submit Quick Report
                  </button>
                  <button style={{ background: "rgba(255,255,255,0.05)", color: "white", padding: "14px 32px", borderRadius: 8, fontSize: "1rem", fontWeight: "600", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                      Request Platform Access
                  </button>
              </div>
          </div>
      </div>

      {/* Stats Section */}
      <div style={{ maxWidth: 1200, margin: "-40px auto 0", position: "relative", zIndex: 20, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, padding: "0 20px" }}>
        {[
            { label: "LIVE SAFE ZONES", val: "85.4%", diff: "+5.2%", color: "#10B981" },
            { label: "ACTIVE REPORTS", val: "124", diff: "-12%", color: "#F59E0B" },
            { label: "AVG RESPONSE TIME", val: "< 8.2m", diff: "~2%", color: "#EF4444" }
        ].map((stat, i) => (
            <div key={i} style={{ background: "#1E293B", padding: 24, borderRadius: 12, border: "1px solid #334155" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "#94A3B8", letterSpacing: "1px" }}>{stat.label}</span>
                    <span style={{ color: "#3B82F6" }}>🛡️</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontSize: "2rem", fontWeight: "bold", color: "white" }}>{stat.val}</span>
                    <span style={{ fontSize: "0.9rem", color: stat.color }}>{stat.diff}</span>
                </div>
            </div>
        ))}
      </div>

      {/* Capabilities Section */}
      <div style={{ maxWidth: 1200, margin: "100px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: 16 }}>Comprehensive Platform Capabilities</h2>
            <div style={{ width: 60, height: 4, background: "#3B82F6", margin: "0 auto 24px" }}></div>
            <p style={{ color: "#94A3B8", maxWidth: 600, margin: "0 auto" }}>
                SafeLanka integrates siloed data sources into a single, unified operational picture for strategic decision-making.
            </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {[
                { title: "Predictive Analytics", desc: "Our proprietary AI models analyze historical data and social indicators to predict crime hotspots before they manifest.", icon: "📍" },
                { title: "Real-time Monitoring", desc: "Consolidate CCTV, sensor data, and mobile reports into a live interactive map for total situational awareness.", icon: "👁️" },
                { title: "Incident Management", desc: "Streamlined digital workflows to assign, track, and resolve emergency incidents with full audit trails.", icon: "🛡️" }
            ].map((f, i) => (
                <div key={i} style={{ background: "#1E293B", padding: 32, borderRadius: 16, border: "1px solid #334155" }}>
                    <div style={{ width: 48, height: 48, background: "rgba(59, 130, 246, 0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", marginBottom: 24, color: "#3B82F6" }}>
                        {f.icon}
                    </div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", marginBottom: 12 }}>{f.title}</h3>
                    <p style={{ color: "#94A3B8", lineHeight: 1.6, fontSize: "0.95rem" }}>{f.desc}</p>
                </div>
            ))}
        </div>
      </div>

      {/* CTA Footer */}
      <div style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 20px" }}>
          <div style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)", padding: "60px 40px", borderRadius: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ maxWidth: 500 }}>
                  <h2 style={{ fontSize: "2rem", fontWeight: "bold", color: "white", marginBottom: 16 }}>Ready to strengthen national security?</h2>
                  <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                      Authorized law enforcement personnel can register for a dashboard account or submit priority intelligence reports immediately.
                  </p>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                  <button style={{ background: "white", color: "#1E3A8A", padding: "12px 24px", borderRadius: 8, fontWeight: "bold", border: "none", cursor: "pointer" }}>
                      Submit Quick Report
                  </button>
                  <button style={{ background: "transparent", color: "white", padding: "12px 24px", borderRadius: 8, fontWeight: "bold", border: "1px solid rgba(255,255,255,0.3)", cursor: "pointer" }}>
                      Contact Support
                  </button>
              </div>
          </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid #334155", padding: "60px 0", background: "#0F172A" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 40 }}>
              <div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "bold", color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#3B82F6" }}>🛡️</span> SafeLanka
                  </div>
                  <p style={{ color: "#94A3B8", fontSize: "0.9rem", lineHeight: 1.6 }}>
                      The National Smart Crime Advisory Platform. Empowers law enforcement with data-driven insights.
                  </p>
              </div>
              {[
                  { head: "PLATFORM", items: ["Live Dashboard", "Crime Heatmaps", "Resource Allocation", "Mobile App"] },
                  { head: "GOVERNMENT", items: ["Police Department", "Defense Ministry", "Intelligence Services", "Portal Privacy"] },
                  { head: "LEGAL", items: ["Data Protection", "Security Protocols", "Access Policy", "System Status"] }
              ].map((col, i) => (
                  <div key={i}>
                      <h4 style={{ color: "white", fontWeight: "bold", marginBottom: 20, fontSize: "0.85rem", letterSpacing: "1px" }}>{col.head}</h4>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {col.items.map(item => (
                              <li key={item} style={{ color: "#94A3B8", marginBottom: 12, fontSize: "0.9rem", cursor: "pointer" }}>{item}</li>
                          ))}
                      </ul>
                  </div>
              ))}
          </div>
          <div style={{ maxWidth: 1200, margin: "40px auto 0", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#64748B", fontSize: "0.8rem" }}>
              <div>© 2024 SafeLanka National Security Initiative. All Rights Reserved.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  SECURE CONNECTION VERIFIED <span style={{ color: "#10B981" }}>🔒</span>
              </div>
          </div>
      </footer>

    </div>
  );
}
