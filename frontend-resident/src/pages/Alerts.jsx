import { useState } from "react";
import { Bell, Flame, Droplets, Activity, Search } from "lucide-react";
import { useData } from "../context/DataContext";

function alertStyle(hazardType, severity) {
  switch (hazardType) {
    case "fire":
      return { Icon: Flame,    color: "text-red-500",    bg: "bg-red-50",    border: "border-red-100",    critical: severity === "critical" };
    case "flood":
      return { Icon: Droplets, color: "text-amber-500",  bg: "bg-amber-50",  border: "border-amber-100",  critical: false };
    case "earthquake":
      return { Icon: Activity, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-100", critical: severity === "critical" };
    default:
      return { Icon: Bell,     color: "text-blue-500",   bg: "bg-blue-50",   border: "border-blue-100",   critical: false };
  }
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function alertTitle(hazardType, severity) {
  const s = severity === "critical" ? "Critical" : "Warning";
  switch (hazardType) {
    case "fire":       return `${s}: Fire Detected`;
    case "flood":      return `${s}: Flood Risk`;
    case "earthquake": return `${s}: Earthquake Detected`;
    default:           return `${s}: Hazard Alert`;
  }
}

function alertDescription(hazardType, nodeId, severity) {
  switch (hazardType) {
    case "fire":
      return `Smoke or temperature anomaly detected by ${nodeId}. Verify and take necessary action.`;
    case "flood":
      return `Water level or distance sensor at ${nodeId} has exceeded safe thresholds.`;
    case "earthquake":
      return `Vibration detected by ${nodeId}. Check for structural impact in the area.`;
    default:
      return `Hazard reported by ${nodeId}. Severity: ${severity}.`;
  }
}

export function Alerts() {
  const { alerts, loading } = useData();
  const [query, setQuery]   = useState("");

  const filtered = alerts.filter(a => {
    const q = query.toLowerCase();
    return (
      a.hazard_type?.toLowerCase().includes(q) ||
      a.node_id?.toLowerCase().includes(q)     ||
      a.severity?.toLowerCase().includes(q)    ||
      a.status?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white px-6 pt-10 pb-6 shadow-sm border-b border-gray-100 rounded-b-3xl z-10 sticky top-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Alerts & Updates</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by hazard, node, or status..."
            className="w-full bg-gray-100 text-sm rounded-full py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
        {loading ? (
          <p className="text-center text-gray-400 text-sm mt-12">Loading alerts…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 gap-3 text-gray-400">
            <Bell size={36} className="opacity-30" />
            <p className="text-sm font-medium">No alerts found</p>
          </div>
        ) : (
          filtered.map(alert => {
            const { Icon, color, bg, border, critical } = alertStyle(alert.hazard_type, alert.severity);
            const isPending = alert.status === "pending";

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-[1.5rem] p-5 border ${border} shadow-sm relative overflow-hidden`}
              >
                {critical && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-red-500 rounded-bl-full opacity-10 blur-xl" />
                )}
                <div className="flex gap-4">
                  <div className={`${bg} ${color} p-3 rounded-2xl h-fit flex-shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 leading-tight">
                        {alertTitle(alert.hazard_type, alert.severity)}
                      </h3>
                      <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                        {timeAgo(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-snug">
                      {alertDescription(alert.hazard_type, alert.node_id, alert.severity)}
                    </p>
                    <span className={`mt-2 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
                      ${isPending
                        ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                        : alert.status === "verified"
                          ? "bg-green-50 text-green-600 border border-green-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200"}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}