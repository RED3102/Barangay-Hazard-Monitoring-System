import { useState, useEffect } from "react";
import { Bell, Camera, X, Plus, Send, RefreshCw } from "lucide-react";

import { API_URL } from "../config";

export function AlertsFeed() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [formData, setFormData] = useState({
    hazardName: "",
    description: "",
    riskLevel: "",
    hazardType: "",
  });

  // Fetch real alerts + reports from backend
  const fetchNotifications = async () => {
    try {
      const [alertsRes, reportsRes] = await Promise.all([
        fetch(`${API_URL}/api/alerts`),
        fetch(`${API_URL}/api/reports`),
      ]);

      const [alertsData, reportsData] = await Promise.all([
        alertsRes.json(),
        reportsRes.json(),
      ]);

      // Transform sensor alerts into notification format
      const alertNotifs = (Array.isArray(alertsData) ? alertsData : []).map((a) => ({
        id: `alert-${a.id}`,
        text: `[${a.hazard_type.charAt(0).toUpperCase() + a.hazard_type.slice(1)}] ${a.hazard_type} alert from ${a.node_id}`,
        description: `Severity: ${a.severity} — Status: ${a.status}`,
        time: a.created_at,
        type: a.severity === "critical" ? "warning" : a.severity === "high" ? "warning" : "info",
        image: null,
        source: "sensor",
        status: a.status,
      }));

      // Transform resident reports into notification format
      const reportNotifs = (Array.isArray(reportsData) ? reportsData : []).map((r) => ({
        id: `report-${r.id}`,
        text: `[${r.hazard_type.charAt(0).toUpperCase() + r.hazard_type.slice(1)}] Resident report — ${r.location}`,
        description: r.description || "No description provided.",
        time: r.created_at,
        type: r.hazard_type === "fire" ? "warning" : r.hazard_type === "flood" ? "info" : "warning",
        image: r.photo_url ? `${API_URL}${r.photo_url}` : null,
        source: "resident",
        status: r.status,
      }));

      // Merge & sort by time (newest first)
      const merged = [...alertNotifs, ...reportNotifs].sort(
        (a, b) => new Date(b.time) - new Date(a.time)
      );

      setNotifications(merged);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins > 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!formData.hazardName.trim() || !formData.hazardType || !formData.riskLevel) return;

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          node: "admin_manual",
          hazard_type: formData.hazardType,
          severity: formData.riskLevel.toLowerCase(),
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setFormData({ hazardName: "", description: "", riskLevel: "", hazardType: "" });
      setShowReportForm(false);
      fetchNotifications(); // Refresh immediately
    } catch (err) {
      console.error("Failed to submit report:", err);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Bell className="text-blue-600" size={20} />
          <h3 className="font-semibold text-gray-900">Notifications & Alerts Feed</h3>
          <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md text-xs font-medium">
            {notifications.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="bg-gray-50 text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowReportForm(!showReportForm)}
            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
          >
            <Plus size={16} /> Report Hazard
          </button>
        </div>
      </div>

      {/* Hazard Report Form */}
      {showReportForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <h4 className="font-medium text-sm text-gray-800 mb-3">Submit Hazard Report</h4>

          {/* Hazard Type */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Hazard Type</label>
            <div className="flex gap-2">
              {["fire", "flood", "earthquake"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, hazardType: type })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                    formData.hazardType === type
                      ? type === "fire"
                        ? "bg-red-100 text-red-700 border-red-300"
                        : type === "flood"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-orange-100 text-orange-700 border-orange-300"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {type === "fire" ? "🔥" : type === "flood" ? "🌊" : "🌍"} {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Hazard Name */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Hazard Name / Title</label>
            <input
              type="text"
              name="hazardName"
              value={formData.hazardName}
              onChange={handleChange}
              placeholder="e.g. Rising water at Zone 3 bridge"
              className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the hazard in detail..."
              className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
              rows="3"
            />
          </div>

          {/* Risk Level */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Risk Level</label>
            <select
              name="riskLevel"
              value={formData.riskLevel}
              onChange={handleChange}
              className="w-full text-sm p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white"
            >
              <option value="">Select risk level...</option>
              <option value="Low">🟢 Low</option>
              <option value="Moderate">🟡 Moderate</option>
              <option value="High">🟠 High</option>
              <option value="Critical">🔴 Critical</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowReportForm(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Send size={15} /> Submit
            </button>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <RefreshCw size={24} className="animate-spin opacity-50" />
            <p className="text-sm">Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
            <Bell size={32} className="opacity-30" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className="flex gap-4 p-4 border border-gray-50 bg-white hover:bg-gray-50 hover:border-gray-100 rounded-xl transition-colors shadow-sm">
              <div className={`w-2.5 h-2.5 mt-1.5 rounded-full flex-shrink-0 ${
                notif.type === "warning" ? "bg-yellow-500" :
                notif.type === "info" ? "bg-blue-500" : "bg-emerald-500"
              }`} />
              <div className="w-full">
                <div className="flex justify-between items-start w-full">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-900">{notif.text}</p>
                    {notif.source === "resident" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">
                        Report
                      </span>
                    )}
                    {notif.source === "sensor" && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-600 border border-cyan-100">
                        Sensor
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2">{timeAgo(notif.time)}</span>
                </div>
                {notif.description && (
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    notif.status === "pending"
                      ? "bg-yellow-50 text-yellow-600 border border-yellow-100"
                      : notif.status === "verified" || notif.status === "reviewed"
                        ? "bg-green-50 text-green-600 border border-green-100"
                        : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}>
                    {notif.status}
                  </span>
                </div>
                {notif.image && (
                  <div className="mt-3 relative group inline-block">
                    <img
                      src={notif.image}
                      alt="Evidence"
                      onClick={() => setLightboxSrc(notif.image)}
                      className="w-16 h-12 object-cover rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <img
                      src={notif.image}
                      alt=""
                      className="absolute bottom-14 left-0 w-52 h-36 object-cover rounded-xl border border-gray-200 shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-10"
                    />
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 w-fit px-2.5 py-1 rounded-md border border-blue-100">
                      <Camera size={13} /> Photo evidence attached
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/75 flex flex-col items-center justify-center z-50 gap-4"
          onClick={() => setLightboxSrc(null)}
        >
          <img
            src={lightboxSrc}
            alt="Full view"
            className="max-w-[90vw] max-h-[75vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setLightboxSrc(null)}
            className="flex items-center gap-2 bg-white text-gray-800 px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            <X size={15} /> Back
          </button>
        </div>
      )}
    </div>
  );
}