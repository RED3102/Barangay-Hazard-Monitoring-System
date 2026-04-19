import { ClipboardList, CheckCircle2, XCircle, Droplets, Flame, Activity, Search } from "lucide-react";
import { useState } from "react";

const HAZARD_ICONS = {
  flood:      Droplets,
  fire:       Flame,
  earthquake: Activity,
};

const HAZARD_BADGE = {
  flood:      "bg-blue-50 text-blue-700 border-blue-200",
  fire:       "bg-red-50 text-red-700 border-red-200",
  earthquake: "bg-orange-50 text-orange-700 border-orange-200",
};

const SEVERITY_BADGE = {
  low:      "bg-green-50 text-green-700 border-green-200",
  medium:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  high:     "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

function formatDateTime(date) {
  const d = new Date(date);
  return {
    date: d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
  };
}

export function ActivityLogPage({ activityLog = [] }) {
  const [filter, setFilter] = useState("all"); // "all" | "approved" | "declined"
  const [search, setSearch] = useState("");

  const filtered = activityLog.filter((entry) => {
    if (filter !== "all" && entry.action !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        entry.hazardType?.toLowerCase().includes(q) ||
        entry.nodeId?.toLowerCase().includes(q) ||
        entry.severity?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const approvedCount = activityLog.filter((e) => e.action === "approved").length;
  const declinedCount = activityLog.filter((e) => e.action === "declined").length;

  return (
    <div className="space-y-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <ClipboardList size={24} className="text-blue-600" />
            Activity Logs
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            History of all verified and declined alert actions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            {approvedCount} Approved
          </span>
          <span className="bg-red-50 text-red-500 border border-red-200 px-3 py-1.5 rounded-full text-xs font-semibold">
            {declinedCount} Declined
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by hazard type, node, severity..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
          {[
            { key: "all", label: "All" },
            { key: "approved", label: "Approved" },
            { key: "declined", label: "Declined" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                filter === tab.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_140px] gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span></span>
          <span>Status</span>
          <span>Hazard Type</span>
          <span>Severity</span>
          <span>Node</span>
          <span>Date & Time</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-gray-50 max-h-[calc(100vh-320px)] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
              <ClipboardList size={40} className="opacity-30" />
              <p className="text-sm font-medium">
                {activityLog.length === 0
                  ? "No activity yet — approved or declined alerts will appear here."
                  : "No logs match your current filter."}
              </p>
            </div>
          ) : (
            filtered.map((entry) => {
              const isApproved = entry.action === "approved";
              const HazardIcon = HAZARD_ICONS[entry.hazardType] || Activity;
              const hazardBadge = HAZARD_BADGE[entry.hazardType] || "bg-gray-50 text-gray-600 border-gray-200";
              const severityBadge = SEVERITY_BADGE[entry.severity] || SEVERITY_BADGE.medium;
              const { date, time } = formatDateTime(entry.timestamp);

              return (
                <div
                  key={entry.id}
                  className="grid grid-cols-[40px_1fr_1fr_1fr_1fr_140px] gap-4 px-6 py-4 items-center hover:bg-gray-50/50 transition-colors"
                >
                  {/* Icon */}
                  <div>
                    {isApproved ? (
                      <CheckCircle2 size={20} className="text-green-500" />
                    ) : (
                      <XCircle size={20} className="text-red-400" />
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                        isApproved
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-500 border border-red-200"
                      }`}
                    >
                      {isApproved ? "Approved" : "Declined"}
                    </span>
                  </div>

                  {/* Hazard Type */}
                  <div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${hazardBadge}`}>
                      <HazardIcon size={13} />
                      {entry.hazardType}
                    </span>
                  </div>

                  {/* Severity */}
                  <div>
                    <span className={`inline-flex text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${severityBadge}`}>
                      {entry.severity}
                    </span>
                  </div>

                  {/* Node */}
                  <div>
                    <span className="text-sm text-gray-700 font-mono">
                      {entry.nodeId}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <p className="text-sm text-gray-800 font-medium">{date}</p>
                    <p className="text-xs text-gray-400">{time}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
