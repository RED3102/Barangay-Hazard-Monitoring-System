import { createContext, useContext, useState, useEffect, useRef } from "react";

export const API_URL = "https://hazard-backend-8dtj.onrender.com";
const STALE_MS        = 5 * 60 * 1000;
const POLL_MS         = 10000;

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [dashboard, setDashboard] = useState(null);
  const [alerts,    setAlerts]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [time,      setTime]      = useState(new Date());

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = async () => {
    try {
      const [dashRes, alertsRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`),
        fetch(`${API_URL}/api/alerts`),
      ]);
      const [dashData, alertsData] = await Promise.all([
        dashRes.json(),
        alertsRes.json(),
      ]);
      setDashboard(dashData);
      if (Array.isArray(alertsData)) setAlerts(alertsData);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  // Derive hazard statuses
  const latest  = dashboard?.latest_reading;
  const isStale = !latest ||
    (Date.now() - new Date(latest.created_at).getTime()) > STALE_MS;

  const floodStatus      = isStale ? "Safe" : (latest.water > 30 || latest.distance < 15 ? "Warning"  : "Safe");
  const fireStatus       = isStale ? "Safe" : (latest.smoke > 100 || latest.temperature > 40 ? "Critical" : "Safe");
  const earthquakeStatus = isStale ? "Safe" : (latest.vibration >= 3 ? "Critical" : "Safe");

  const systemOnline = !isStale;

  const dateLabel = time.toLocaleDateString("en-PH", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <DataContext.Provider value={{
      dashboard,
      alerts,
      loading,
      latest,
      isStale,
      systemOnline,
      floodStatus,
      fireStatus,
      earthquakeStatus,
      dateLabel,
      refetch: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside DataProvider");
  return ctx;
}