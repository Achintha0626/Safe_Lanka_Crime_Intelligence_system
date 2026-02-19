import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import SriLankaHeatmap from "./SriLankaHeatmap";

const API_BASE = "/api";

export default function PublicDashboard() {
  const { user } = useAuth();
  // Metadata
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [crimeTypes, setCrimeTypes] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [adminDistricts, setAdminDistricts] = useState([]);

  // Default Filters for Public (Only Historical)
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [crimeType, setCrimeType] = useState("");

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Metadata
  useEffect(() => {
    fetch(`${API_BASE}/metadata/`)
      .then((res) => res.json())
      .then((meta) => {
        setYears(meta.years || []);
        setMonths(meta.months || []);
        setCrimeTypes(meta.crime_types || []);
        setDistricts(meta.districts || []);
        setAdminDistricts(meta.administrative_districts || []);
        
        // Defaults
        if (meta.years?.length) setYear(String(meta.years[meta.years.length - 1]));
        if (meta.months?.length) setMonth(String(meta.months[0]));
        if (meta.crime_types?.length) setCrimeType(meta.crime_types[0]);
      })
      .catch(console.error);
  }, []);

  // Fetch Public Data (Enhanced for Officials)
  useEffect(() => {
      if (!year || !month || !crimeType) return;
      
      setLoading(true);
      
      async function fetchData() {
          try {
              const riskUrl = `${API_BASE}/risk-by-district/?year=${year}&month=${month}&crime_type=${crimeType}`;
              console.log("Fetching risk data from:", riskUrl);
              
              const requests = [
                  fetch(riskUrl)
              ];
              
              const isOfficial = user && (user.role === 'POLICE' || user.role === 'ADMIN');
              if (isOfficial) {
                  const countUrl = `${API_BASE}/crime-count-by-district/?year=${year}&month=${month}&crime_type=${crimeType}`;
                  console.log("Fetching count data from:", countUrl);
                  requests.push(fetch(countUrl));
              }
              
              const responses = await Promise.all(requests);
              console.log("Response statuses:", responses.map(r => r.status));
              
              const riskData = await responses[0].json();
              const countData = isOfficial ? await responses[1].json() : {};
              
              console.log("PublicDashboard - API Response:");
              console.log("riskData:", riskData);
              console.log("countData:", countData);
              console.log("adminDistricts:", adminDistricts);
              console.log("isOfficial:", isOfficial);
              
              const normalized = {};
              
              // 1. Initialize all known administrative districts with defaults
              adminDistricts.forEach(d => {
                  normalized[d] = {
                      risk: "Low",
                      count: isOfficial ? 0 : null,
                      explanation: "Public data: General risk assessment only."
                  };
              });

              console.log("After initialization:", JSON.parse(JSON.stringify(normalized)));

              // 2. Overlay API Data
              const allKeys = new Set([...Object.keys(riskData), ...Object.keys(countData)]);
              console.log("allKeys:", Array.from(allKeys));
              
              allKeys.forEach(d => {
                  // If district not in metadata list (edge case), create it
                  if(!normalized[d]) {
                      console.log(`Creating new entry for: ${d}`);
                      normalized[d] = { risk: "Low", count: isOfficial ? 0 : null, explanation: "" };
                  }
                  
                  if (riskData[d]) {
                      console.log(`Updating ${d} risk from ${normalized[d].risk} to ${riskData[d]}`);
                      normalized[d].risk = riskData[d];
                  }
                  if (isOfficial && countData[d] !== undefined) {
                      console.log(`Updating ${d} count from ${normalized[d].count} to ${countData[d]}`);
                      normalized[d].count = countData[d];
                  }
              });
              
              console.log("After overlay:", JSON.parse(JSON.stringify(normalized)));
              console.log("Anuradhapura data:", normalized["Anuradhapura"]);
              
              setDashboardData(normalized);
          } catch(err) {
              console.error(err);
              setDashboardData({});
          } finally {
              setLoading(false);
          }
      }
      
      fetchData();
  }, [year, month, crimeType, user, adminDistricts]);

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(to right, #10B981, #34D399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Community Safety Map
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>Stay informed about safety trends in your district.</p>
      </div>
      
      {/* Simple Filter */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
           <select value={year} onChange={(e)=>setYear(e.target.value)} style={selectStyle}>
               {years.map(y=><option key={y} value={y}>{y}</option>)}
           </select>
           <select value={month} onChange={(e)=>setMonth(e.target.value)} style={selectStyle}>
               {months.map(m=><option key={m} value={m}>Month {m}</option>)}
           </select>
           <select value={crimeType} onChange={(e)=>setCrimeType(e.target.value)} style={selectStyle}>
               {crimeTypes.map(c=><option key={c} value={c}>{c}</option>)}
           </select>
      </div>
      
      <div style={{ background: "var(--bg-secondary)", padding: 8, borderRadius: 16, border: "1px solid var(--border)", position: "relative" }}>
         {loading && <div style={{position:"absolute", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.5)", zIndex:10, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center"}}>Loading...</div>}
         <SriLankaHeatmap 
            mode="historical" 
            year={year} 
            month={month} 
            crimeType={crimeType} 
            data={dashboardData} 
         />
      </div>
      
      <div style={{ marginTop: 32, textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
          <p>This dashboard is for public awareness only. For official reports, contact local law enforcement.</p>
      </div>
    </div>
  );
}

const selectStyle = {
    padding: "8px 16px",
    borderRadius: 20,
    border: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    color: "var(--text-primary)",
    fontSize: "1rem"
};
