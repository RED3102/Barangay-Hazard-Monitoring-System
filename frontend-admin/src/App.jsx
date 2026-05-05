import { useState, useEffect } from "react";
import { Sidebar }                from "./components/Sidebar";
import { Header }                 from "./components/Header";
import { AdminLogin }             from "./components/AdminLogin";
import { HazardStatusCard }       from "./components/HazardStatusCard";
import { FireNodesPanel }         from "./components/FireNodesPanel";
import { SensorChart }            from "./components/SensorChart";
import { AIDetectionPanel }       from "./components/AIDetectionPanel";
import { AlertVerificationPanel } from "./components/AlertVerificationPanel";
import { AlertsFeed }             from "./components/AlertsFeed";
import { ActivityLogPage }        from "./components/ActivityLogPage";
import { AnalyticsPage }          from "./components/AnalyticsPage";
import { ResidentsPage }          from "./components/ResidentsPage";
import {
  Droplets, Flame, Activity, Bell,
  RadioTower, ShieldAlert, ArrowUpRight, Users
} from "lucide-react";

import { API_URL } from "./config";

function parseJwt(token) {
  try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
}

function isTokenValid(token) {
  if (!token) return false;
  const payload = parseJwt(token);
  return payload ? payload.exp * 1000 > Date.now() : false;
}

export default function App() {
  const [activeMenu,      setActiveMenu]      = useState("dashboard");
  const [dashboard,       setDashboard]       = useState(null);
  const [sensorHistory,   setSensorHistory]   = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activityLog,     setActivityLog]     = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUser,       setAdminUser]       = useState(null);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (isTokenValid(token)) {
      const payload = parseJwt(token);
      setAdminUser({ name: payload.name || "Barangay Official" });
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (user) => {
    setAdminUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  const addLogEntry = (alert, action) => {
    const entry = {
      id:         Date.now(),
      action,
      hazardType: alert.hazard_type,
      severity:   alert.severity,
      nodeId:     alert.node_id,
      timestamp:  new Date(),
    };
    setActivityLog((prev) => [entry, ...prev].slice(0, 50));
  };

  const fetchDashboard = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/dashboard`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (data.status === "error") throw new Error(data.message);
      setDashboard(data);
    } catch (err) {
      console.error("Failed to fetch dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/readings/history`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) setSensorHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboard();
    fetchHistory();
    const interval = setInterval(() => {
      fetchDashboard();
      fetchHistory();
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Chart data — filter by node so each chart only shows its own sensor's readings
  const waterData = sensorHistory
    .filter((r) => r.node_id === "flood_node")
    .map((r) => ({
      time:  new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: r.water ?? 0,
    }));
  const smokeData = sensorHistory
    .filter((r) => r.node_id === "fire_node")
    .map((r) => ({
      time:  new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: r.smoke ?? 0,
    }));
  const vibrationData = sensorHistory
    .filter((r) => r.node_id === "earthquake_node")
    .map((r) => ({
      time:  new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      value: r.vib ?? r.vibration ?? 0,
    }));

  // Derived state
  const STALE_MS      = 5 * 60 * 1000;
  const latest        = dashboard?.latest_reading;
  const activeAlerts  = dashboard?.active_alerts || [];
  const currentHazard = activeAlerts[0] || null;

  const latestByNode = {};
  sensorHistory.forEach((r) => { latestByNode[r.node_id] = r; });

  const floodLatest      = latestByNode["flood_node"];
  const fireLatest       = latestByNode["fire_node"];
  const earthquakeLatest = latestByNode["earthquake_node"];

  const isNodeStale = (n) =>
    !n || (Date.now() - new Date(n.created_at).getTime()) > STALE_MS;

  const floodStatus = isNodeStale(floodLatest) ? "Safe"
    : (floodLatest.water > 30 || floodLatest.distance < 15 ? "Warning" : "Safe");

  const fireStatus = isNodeStale(fireLatest) ? "Safe"
    : (fireLatest.smoke > 100 || fireLatest.temperature > 40 ? "Critical" : "Safe");

  const earthquakeVib    = earthquakeLatest?.vibration ?? earthquakeLatest?.vib ?? 0;
  const earthquakeStatus = isNodeStale(earthquakeLatest) ? "Safe"
    : (earthquakeVib >= 3.0 ? "Critical" : "Safe");

  const activeNodeIds = [...new Set(
    sensorHistory
      .filter(r => (Date.now() - new Date(r.created_at).getTime()) < STALE_MS)
      .map(r => r.node_id)
  )];
  const nodesOnline = activeNodeIds.length;

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Loading system data...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeMenu) {
      case "sensor-monitoring":
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensor Data Monitoring</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <SensorChart
                  title="Water Level Sensor"
                  data={waterData.length > 0 ? waterData : [{ time: "now", value: floodLatest?.water || 0 }]}
                  unit="meter" color="#2563eb"
                />
                <SensorChart
                  title="Fire Sensor"
                  data={smokeData.length > 0 ? smokeData : [{ time: "now", value: fireLatest?.smoke || 0 }]}
                  unit="infrared radiation" color="#dc2626"
                />
                <SensorChart
                  title="Earthquake Sensor"
                  data={vibrationData.length > 0 ? vibrationData : [{ time: "now", value: earthquakeLatest?.vib ?? earthquakeLatest?.vibration ?? 0 }]}
                  unit="normalized (0–5)" color="#f59e0b"
                />
              </div>
            </section>
          </div>
        );

      case "hazard-alerts":
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hazard Alerts &amp; Notifications</h2>
              <AlertsFeed />
            </section>
          </div>
        );

      case "alert-verification": {
        const hazardMap = { flood: null, fire: null, earthquake: null };
        activeAlerts.forEach((a) => {
          if (hazardMap[a.hazard_type] === null) hazardMap[a.hazard_type] = a;
        });
        const derivedHazards = [
          { hazardType: hazardMap.flood      ? "Flooding Detected"   : "No Flood Detected",    riskLevel: hazardMap.flood      ? hazardMap.flood.severity      : "Low", confidence: hazardMap.flood      ? 90 : 10 },
          { hazardType: hazardMap.fire       ? "Fire Detected"       : "No Fire Detected",      riskLevel: hazardMap.fire       ? hazardMap.fire.severity       : "Low", confidence: hazardMap.fire       ? 90 : 10 },
          { hazardType: hazardMap.earthquake ? "Earthquake Detected" : "No Earthquake Detected",riskLevel: hazardMap.earthquake ? hazardMap.earthquake.severity : "Low", confidence: hazardMap.earthquake ? 90 : 10 },
        ];
        return (
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Detection and Alert Verification</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AIDetectionPanel hazards={derivedHazards} lastUpdated={latest?.created_at} />
                <AlertVerificationPanel alerts={activeAlerts} onRefresh={fetchDashboard} onLogActivity={addLogEntry} />
              </div>
            </section>
          </div>
        );
      }

      case "activity-logs":
        return <ActivityLogPage activityLog={activityLog} />;

      case "residents":
        return <ResidentsPage />;

      case "reports-analytics":
        return <AnalyticsPage />;
      case "system-settings":
        return (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="text-center text-gray-500">
              <h2 className="text-xl font-semibold mb-2">View in Progress</h2>
              <p>This section is currently being developed.</p>
            </div>
          </div>
        );

      case "dashboard":
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Overview</h1>
                <p className="text-gray-500 text-sm mt-1">Real-time pulse of your complete monitoring environment.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  System Online
                </span>
                <span className="text-sm text-gray-500 font-medium bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                  Last sync: Just now
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeAlerts.length}</h3>
                  </div>
                  <div className="bg-red-50 p-2.5 rounded-xl text-red-600"><ShieldAlert size={20} /></div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <ArrowUpRight size={16} className="text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">{activeAlerts.length}</span>
                  <span className="text-gray-400 ml-2">pending verification</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nodes Online</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{nodesOnline} / 3</h3>
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><RadioTower size={20} /></div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-emerald-600 font-medium font-mono text-xs">
                    {activeNodeIds.join(", ") || "—"}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-500">High Risk Zones</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{activeAlerts.length}</h3>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><Users size={20} /></div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-amber-600 font-medium">
                    {activeAlerts.length > 0
                      ? `${activeAlerts.length} zone${activeAlerts.length > 1 ? "s" : ""} with active alerts`
                      : "All zones clear"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                  <h3 className="font-semibold text-gray-900">Current Hazard Levels</h3>
                  <button onClick={() => setActiveMenu("sensor-monitoring")} className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    View All Sensors
                  </button>
                </div>
                <div className="p-5 flex-1 bg-gradient-to-b from-white to-gray-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
                    <HazardStatusCard title="Flood Risk"     status={floodStatus}      icon={Droplets} lastUpdate={floodLatest?.created_at      ? new Date(floodLatest.created_at).toLocaleTimeString()      : "No data"} />
                    <FireNodesPanel
                        sensorHistory={sensorHistory}
                        activeAlerts={activeAlerts}
                    />
                    <HazardStatusCard title="Earthquake"     status={earthquakeStatus} icon={Activity} lastUpdate={earthquakeLatest?.created_at ? new Date(earthquakeLatest.created_at).toLocaleTimeString() : "No data"} />
                  </div>

                  {currentHazard && (
                    <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-4">
                      <div className="bg-blue-100 p-2.5 rounded-full text-blue-600 shrink-0"><Bell size={18} /></div>
                      <div>
                        <h4 className="text-sm font-semibold text-blue-900 capitalize">
                          {currentHazard.hazard_type} Alert — Action Required
                        </h4>
                        <p className="text-sm text-blue-700/80 mt-1 leading-relaxed">
                          Node <span className="font-mono">{currentHazard.node_id}</span> reported
                          a <strong>{currentHazard.severity}</strong> {currentHazard.hazard_type} event
                          and is pending barangay official verification.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 flex justify-center items-center border-t border-gray-50">
                  <button onClick={() => setActiveMenu("alert-verification")} className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    View All Notifications <ArrowUpRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar activeMenu={activeMenu} setActiveMenu={setActiveMenu} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={adminUser} onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="w-full h-full">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}