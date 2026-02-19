import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";

function styleByRisk(riskInput) {
  const risk = (riskInput || "Low").toString().toLowerCase().trim();
  if (risk === "high")
    return { fillColor: "#ef4444", weight: 2, fillOpacity: 0.7, color: "#1e40af" }; // Red fill, Dark Blue outline
  if (risk === "medium")
    return { fillColor: "#f59e0b", weight: 2, fillOpacity: 0.6, color: "#1e40af" }; // Orange fill
  // Low or default
  return { fillColor: "#22c55e", weight: 1, fillOpacity: 0.45, color: "#2563eb" }; // Green fill
}

const norm = (s) => (s ?? "").toString().trim().toLowerCase();

export default function SriLankaHeatmap({ mode, year, month, crimeType, data, dataVersion }) {
  const [geoData, setGeoData] = useState(null);

  // Load GeoJSON once
  useEffect(() => {
    fetch("/maps/sri_lanka_districts.geojson")
      .then((res) => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Case-insensitive mapping to standard Administrative District names
  const DISTRICT_MAP = {
      "anurdhapura": "Anuradhapura",
      "anuradhapura": "Anuradhapura",
      "badulla": "Badulla",
      "batticaloa": "Batticaloa",
      "colombo": "Colombo",
      "colombo (n)": "Colombo",
      "colombo (s)": "Colombo",
      "colombo ©": "Colombo",
      "mt.lavinia": "Colombo",
      "nugegoda": "Colombo",
      "gampaha": "Gampaha",
      "kelaniya": "Gampaha",
      "negombo": "Gampaha",
      "kalutara": "Kalutara",
      "kaluthara": "Kalutara",
      "panadura": "Kalutara",
      "galle": "Galle",
      "elpitiya": "Galle",
      "matara": "Matara",
      "hambantota": "Hambantota",
      "tangalle": "Hambantota",
      "jaffna": "Jaffna",
      "kks": "Jaffna",
      "kilinochchi": "Kilinochchi",
      "mannar": "Mannar",
      "vavuniya": "Vavuniya",
      "mullativu": "Mullaitivu",
      "mullaitivu": "Mullaitivu",
      "trincomalee": "Trincomalee",
      "kantale": "Trincomalee",
      "ampara": "Ampara",
      "kurunegala": "Kurunegala",
      "puttalam": "Puttalam",
      "chilaw": "Puttalam",
      "kandy": "Kandy",
      "gampola": "Kandy",
      "teldeniya": "Kandy",
      "matale": "Matale",
      "nuwaraeliya": "Nuwara Eliya",
      "nuwara eliya": "Nuwara Eliya",
      "hatton": "Nuwara Eliya",
      "polonnaruwa": "Polonnaruwa",
      "kebithigollewa": "Anuradhapura",
      "monaragala": "Monaragala",
      "ratnapura": "Ratnapura",
      "kegalle": "Kegalle"
  };

  // Helper to get normalized data entry
  const dataLookup = {};
  
  if (data) {
      Object.keys(data).forEach(rawKey => {
          const keyLower = norm(rawKey);
          const districtName = DISTRICT_MAP[keyLower];
          
          // Skip if not a valid district (e.g. specialized units like CID, Narcotics)
          if (!districtName) return;
          
          const rawEntry = data[rawKey];
          const stdKey = norm(districtName);

          if (!dataLookup[stdKey]) {
              dataLookup[stdKey] = { ...rawEntry, count: rawEntry.count || 0 };
          } else {
              // Aggregate: Sum counts
              if (rawEntry.count !== null && rawEntry.count !== undefined) {
                 dataLookup[stdKey].count = (dataLookup[stdKey].count || 0) + rawEntry.count;
              }
              
              // Aggregate: Maximize Risk
              const riskOrder = { "Low": 1, "Medium": 2, "High": 3 };
              const currentRisk = dataLookup[stdKey].risk || "Low";
              const newRisk = rawEntry.risk || "Low";
              if (riskOrder[newRisk] > riskOrder[currentRisk]) {
                  dataLookup[stdKey].risk = newRisk;
              }
              
              // Concatenate explanations if unique? (Optional, maybe skip for now)
          }
      });
  }

  if (!geoData) return <div style={{color: "white"}}>Loading Map...</div>;

  return (
    <MapContainer
      center={[7.8, 80.7]}
      zoom={7}
      style={{ height: "600px", width: "100%", borderRadius: 12 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <GeoJSON
        key={`${mode}-${year}-${month}-${crimeType}-${dataVersion}`} // Force re-render on filter OR data change
        data={geoData}
        style={(feature) => {
          const geoName = feature?.properties?.adm2_name;
          const entry = dataLookup[norm(geoName)];
          const risk = entry?.risk || "Low";
          return styleByRisk(risk);
        }}
        onEachFeature={(feature, layer) => {
          const geoName = feature?.properties?.adm2_name;
          const entry = dataLookup[norm(geoName)];
          const risk = entry?.risk || "Low";
          const count = entry?.count;
          const explanation = entry?.explanation;
          
          const monthLabel = String(month).padStart(2, "0");

          layer.bindPopup(
            `<b>${geoName}</b>
             <br/>Mode: ${mode === 'predicted' ? 'Predicted (ML)' : 'Historical'}
             <br/>Period: ${year}-${monthLabel}
             <br/>Crime Type: ${crimeType}
             ${count !== null && count !== undefined ? `<br/>${mode === 'predicted' ? 'Predicted' : 'Count'}: ${count}` : ''}
             <br/>Risk: ${risk}
             ${explanation ? `<hr/><div style="max-width:200px; white-space:normal;"><i>${explanation}</i></div>` : ""}`
          );
        }}
      />
    </MapContainer>
  );
}
