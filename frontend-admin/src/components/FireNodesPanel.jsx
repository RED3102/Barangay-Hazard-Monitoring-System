import { useState, useEffect } from "react";
import {
  Flame, ChevronDown, ChevronUp, Plus, Trash2,
  User, MapPin, AlertCircle, CheckCircle, RefreshCw
} from "lucide-react";
import { API_URL } from "../config";

const STALE_MS = 5 * 60 * 1000;

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
  if (!dateStr) return "No data";
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

const INITIAL_FORM = { node_id: "", owner_name: "", address: "" };

export function FireNodesPanel({ sensorHistory, activeAlerts }) {
  const [profiles,  setProfiles]  = useState([]);
  const [expanded,  setExpanded]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(INITIAL_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  const fetchProfiles = async () => {
    try {
      const res  = await fetch(`${API_URL}/api/node-profiles`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setProfiles(data);
    } catch (err) {
      console.error("Failed to fetch node profiles:", err);
    }
  };

  useEffect(() => { fetchProfiles(); }, []);

  const handleSave = async () => {
    setError("");
    setSuccess("");
    if (!form.node_id || !form.owner_name || !form.address) {
      return setError("All fields are required.");
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/node-profiles`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ ...form, node_type: "fire" }),
      });
      if (!res.ok) {
        const d = await res.json();
        return setError(d.error || "Failed to save.");
      }
      setSuccess("Node profile saved.");
      setForm(INITIAL_FORM);
      setShowForm(false);
      fetchProfiles();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nodeId) => {
    if (!confirm(`Remove profile for ${nodeId}?`)) return;
    try {
      await fetch(`${API_URL}/api/node-profiles/${nodeId}`, {
        method:  "DELETE",
        headers: authHeaders(),
      });
      fetchProfiles();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Derive per-node status from sensor history and active alerts
  const getNodeInfo = (nodeId) => {
    const readings = sensorHistory?.filter(r => r.node_id === nodeId) || [];
    const latest   = readings[readings.length - 1];
    const isStale  = !latest || (Date.now() - new Date(latest.created_at).getTime()) > STALE_MS;
    const hasAlert = activeAlerts?.some(
      a => a.node_id === nodeId && a.status === "pending"
    );
    const smoke    = latest?.smoke ?? 0;
    const temp     = latest?.temperature ?? 0;
    const isHazard = !isStale && (smoke > 100 || temp > 40);

    return { latest, isStale, hasAlert, isHazard, smoke, temp };
  };

  // Overall fire status — any active fire alert across all fire nodes
  const anyFireHazard = profiles.some(p => {
    const { isHazard } = getNodeInfo(p.node_id);
    return isHazard;
  });

  const statusColor = anyFireHazard
    ? "text-red-600 bg-red-50 border-red-200"
    : "text-emerald-600 bg-emerald-50 border-emerald-200";

  const statusLabel = anyFireHazard ? "Alert" : "Safe";

  return (
    <div className={`bg-white rounded-[1.5rem] border shadow-sm overflow-hidden
      ${anyFireHazard ? "border-red-200" : "border-gray-100"}`}>

      {/* Header — always visible, click to expand */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
            ${anyFireHazard ? "bg-red-50 text-red-500" : "bg-orange-50 text-orange-500"}`}>
            <Flame size={20} />
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-medium">Fire Detection</p>
            <p className={`font-bold text-sm mt-0.5 ${anyFireHazard ? "text-red-600" : "text-emerald-600"}`}>
              {statusLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColor}`}>
            {profiles.length} node{profiles.length !== 1 ? "s" : ""} registered
          </span>
          {expanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          {/* Node list */}
          <div className="p-4 space-y-3">
            {profiles.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Flame size={28} className="mx-auto opacity-20 mb-2" />
                <p className="text-sm">No fire nodes registered yet.</p>
                <p className="text-xs mt-1">Add a node below to start monitoring.</p>
              </div>
            )}

            {profiles.map(profile => {
              const { latest, isStale, isHazard, smoke, temp } = getNodeInfo(profile.node_id);
              return (
                <div
                  key={profile.node_id}
                  className={`rounded-xl p-4 border transition-colors
                    ${isHazard
                      ? "bg-red-50 border-red-200"
                      : isStale
                        ? "bg-gray-50 border-gray-200"
                        : "bg-emerald-50 border-emerald-100"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isHazard
                          ? <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                          : <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        }
                        <span className={`text-xs font-bold uppercase tracking-wider
                          ${isHazard ? "text-red-600" : isStale ? "text-gray-400" : "text-emerald-600"}`}>
                          {isHazard ? "Fire Detected" : isStale ? "Offline" : "Safe"}
                        </span>
                        <span className="text-[10px] text-gray-400 ml-auto">
                          {timeAgo(latest?.created_at)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mb-0.5">
                        <User size={12} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">{profile.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">{profile.address}</span>
                      </div>

                      {!isStale && (
                        <div className="flex gap-3 text-xs text-gray-500">
                          <span>Smoke: <strong>{smoke}</strong></span>
                          <span>Temp: <strong>{temp}°C</strong></span>
                        </div>
                      )}

                      <p className="text-[10px] font-mono text-gray-400 mt-1">{profile.node_id}</p>
                    </div>

                    <button
                      onClick={() => handleDelete(profile.node_id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add node form */}
          <div className="border-t border-gray-100 p-4">
            {success && (
              <p className="text-xs text-emerald-600 font-medium mb-3 flex items-center gap-1">
                <CheckCircle size={12} /> {success}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-600 font-medium mb-3 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}

            {!showForm ? (
              <button
                onClick={() => { setShowForm(true); setSuccess(""); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm hover:border-blue-400 hover:text-blue-500 transition-colors"
              >
                <Plus size={16} />
                Register Fire Node
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">Register Fire Node</p>
                {[
                  { key: "node_id",    label: "Node ID",       placeholder: "fire_node_001 or fire_node_blk4_lot12" },
                  { key: "owner_name", label: "Owner Name",    placeholder: "Juan Dela Cruz"           },
                  { key: "address",    label: "Home Address",  placeholder: "Block 4, Lot 12, Zone 3"  },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      {label}
                    </label>
                    <input
                      type="text"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "Saving…" : "Save Node"}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setForm(INITIAL_FORM); setError(""); }}
                    className="px-4 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}