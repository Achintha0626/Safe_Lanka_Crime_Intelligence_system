import axios from "axios";
const API_BASE = "/api";

export const fetchPredictedRiskYearDetailed = async (year, crimeType) => {
  const res = await axios.get(
    `${API_BASE}/predict-risk-year-detailed/?year=${year}&crime_type=${encodeURIComponent(
      crimeType,
    )}`,
  );
  return res.data;
};
