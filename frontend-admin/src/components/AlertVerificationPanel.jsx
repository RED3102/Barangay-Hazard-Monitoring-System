import { useState } from "react";
import { AlertCircle, Check, X } from "lucide-react";

const API_URL = "https://backend-production-f78d.up.railway.app";

const HAZARD_STYLES = {
  flood:      { levelBg: "bg-blue-50",   levelColor: "text-blue-600"   },
  fire:       { levelBg: "bg-red-50",    levelColor: "text-red-600"    },
  earthquake: { levelBg: "bg-orange-50", levelColor: "text-orange-600" },
};

const SEVERITY_STYLES = {
  critical: { levelBg: "bg-red-50",    levelColor: "text-red-500"    },
  high:     { levelBg: "bg-yellow-50", levelColor: "text-yellow-600" },
};

export function AlertVerificationPanel({ alerts = [], onRefresh, onLogActivity }) {
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError]         = useState(null);

  async function handleAction(alert, status) {
    setLoadingId(alert.id);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/alerts/${alert.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      // Log to activity feed: approved alerts show in log; declined are silently removed
      if (onLogActivity) {
        onLogActivity(alert, status === "verified" ? "approved" : "declined");
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setError(`Failed to update alert: ${err.message}`);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Alert Verification</h3>
        </div>
        <span className="bg-red-50 text-red-500 px-2.5 py-1 rounded-md text-xs font-medium">
          {alerts.length} Pending
        </span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Alert list */}
      <div className="space-y-4 flex-1 overflow-y-auto pr-1">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-12 gap-2">
            <AlertCircle size={32} className="opacity-30" />
            <p className="text-sm">No pending alerts</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const hazardStyle   = HAZARD_STYLES[alert.hazard_type]  || HAZARD_STYLES.flood;
            const severityStyle = SEVERITY_STYLES[alert.severity]   || SEVERITY_STYLES.high;
            const isLoading     = loadingId === alert.id;

            return (
              <div key={alert.id} className="border border-gray-100 rounded-xl p-4">
                {/* Alert meta */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {alert.hazard_type} Alert
                    </h4>
                    <p className="text-sm text-gray-500 font-mono">{alert.node_id}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(alert.created_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`${hazardStyle.levelBg} ${hazardStyle.levelColor} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                      {alert.hazard_type}
                    </span>
                    <span className={`${severityStyle.levelBg} ${severityStyle.levelColor} px-2 py-0.5 rounded text-xs font-medium capitalize`}>
                      {alert.severity}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 mt-3">
                  <button
                    disabled={isLoading}
                  onClick={() => handleAction(alert, "verified")}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Check size={16} />
                    {isLoading ? "Updating…" : "Approve"}
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => handleAction(alert, "dismissed")}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <X size={16} />
                    {isLoading ? "Updating…" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}