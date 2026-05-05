import { useState, useEffect } from "react";
import { CheckCircle, Clock, RefreshCw, Flame, Droplets, Activity, Bell } from "lucide-react";
import { API_URL } from "../config";

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const HAZARD_STYLES = {
  flood:      { Icon: Droplets, color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200"   },
  fire:       { Icon: Flame,    color: "text-red-600",    bg: "bg-red-50",    border: "border-red-200"    },
  earthquake: { Icon: Activity, color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200"  },
};

export function AlertVerificationPanel({ alerts, onRefresh, onLogActivity }) {
  const [responding, setResponding] = useState(null);

  const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "pending");

  const handleResponded = async (alert) => {
    setResponding(alert.id);
    try {
      await fetch(`${API_URL}/api/alerts/${alert.id}`, {
        method:  "PATCH",
        headers: authHeaders(),
        body:    JSON.stringify({ status: "responded" }),
      });
      onLogActivity?.(alert, "responded");
      onRefresh?.();
    } catch (err) {
      console.error("Failed to update alert:", err);
    } finally {
      setResponding(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Alert Verification</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold px-2 py-1 rounded-full
            ${activeAlerts.length > 0
              ? "bg-red-50 text-red-600 border border-red-100"
              : "bg-gray-100 text-gray-400"}`}>
            {activeAlerts.length} Active
          </span>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[420px]">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle size={32} className="opacity-30 mb-3" />
            <p className="text-sm font-medium">No pending alerts</p>
            <p className="text-xs mt-1">All hazards have been responded to</p>
          </div>
        ) : (
          activeAlerts.map(alert => {
            const style = HAZARD_STYLES[alert.hazard_type] || HAZARD_STYLES.flood;
            const { Icon, color, bg, border } = style;
            const isResponding = responding === alert.id;

            return (
              <div
                key={alert.id}
                className={`rounded-xl p-4 border ${border} ${bg} relative overflow-hidden`}
              >
                <div className="flex gap-3">
                  <div className={`${color} p-2 rounded-xl bg-white/60 flex-shrink-0 h-fit`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`text-sm font-bold capitalize ${color}`}>
                        {alert.hazard_type} Alert
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
                        <Clock size={11} />
                        {timeAgo(alert.created_at)}
                      </div>
                    </div>

                    <p className="text-xs text-gray-600 mb-1">
                      Node: <span className="font-mono font-medium">{alert.node_id}</span>
                    </p>
                    <p className="text-xs text-gray-600 mb-3">
                      Severity: <span className="font-semibold capitalize">{alert.severity}</span>
                    </p>

                    <button
                      onClick={() => handleResponded(alert)}
                      disabled={isResponding}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-colors
                        ${isResponding
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50"}`}
                    >
                      <CheckCircle size={15} />
                      {isResponding ? "Updating…" : "Mark as Responded"}
                    </button>
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