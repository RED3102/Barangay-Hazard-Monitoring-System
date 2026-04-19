import { useState, useEffect } from "react";
import {
  Users, CheckCircle, XCircle, Clock, UserPlus,
  Phone, MapPin, User, Lock, Eye, EyeOff,
  RefreshCw, AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = "https://backend-production-f78d.up.railway.app";

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${getToken()}`,
  };
}

function timeAgo(dateStr) {
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const STATUS_STYLE = {
  pending:  { label: "Pending",  color: "text-amber-700",  bg: "bg-amber-50",  border: "border-amber-100"  },
  approved: { label: "Approved", color: "text-emerald-700",bg: "bg-emerald-50",border: "border-emerald-100"},
  rejected: { label: "Rejected", color: "text-red-700",    bg: "bg-red-50",    border: "border-red-100"    },
};

const INITIAL_FORM = { full_name: "", phone: "", address: "", password: "" };

// ── Sub-component: resident row ──────────────────────────────────────────────
function ResidentRow({ resident, onApprove, onReject, loading }) {
  const s = STATUS_STYLE[resident.status] || STATUS_STYLE.pending;

  return (
    <div className={`bg-white rounded-2xl p-5 border ${s.border} shadow-sm`}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 leading-tight">{resident.full_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{timeAgo(resident.created_at)}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${s.color} ${s.bg} ${s.border}`}>
          {s.label}
        </span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={13} className="text-gray-400 flex-shrink-0" />
          <span>{resident.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={13} className="text-gray-400 flex-shrink-0" />
          <span>{resident.address}</span>
        </div>
      </div>

      {resident.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(resident.id)}
            disabled={loading === resident.id}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={15} />
            Approve
          </button>
          <button
            onClick={() => onReject(resident.id)}
            disabled={loading === resident.id}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-100 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function ResidentsPage() {
  const [tab,        setTab]        = useState("pending");   // "pending" | "all" | "create"
  const [residents,  setResidents]  = useState([]);
  const [fetching,   setFetching]   = useState(true);
  const [actionId,   setActionId]   = useState(null);        // id being approved/rejected

  const [form,       setForm]       = useState(INITIAL_FORM);
  const [showPw,     setShowPw]     = useState(false);
  const [creating,   setCreating]   = useState(false);
  const [createMsg,  setCreateMsg]  = useState(null);        // { type: "success"|"error", text }

  const fetchResidents = async () => {
    setFetching(true);
    try {
      const res  = await fetch(`${API_URL}/api/residents`, { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setResidents(data);
    } catch (err) {
      console.error("Fetch residents:", err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchResidents(); }, []);

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await fetch(`${API_URL}/api/residents/${id}/approve`, {
        method: "PATCH", headers: authHeaders(),
      });
      setResidents(r => r.map(x => x.id === id ? { ...x, status: "approved" } : x));
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    setActionId(id);
    try {
      await fetch(`${API_URL}/api/residents/${id}/reject`, {
        method: "PATCH", headers: authHeaders(),
      });
      setResidents(r => r.map(x => x.id === id ? { ...x, status: "rejected" } : x));
    } finally {
      setActionId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateMsg(null);

    if (!form.full_name || !form.phone || !form.address || !form.password) {
      return setCreateMsg({ type: "error", text: "All fields are required." });
    }
    if (form.password.length < 6) {
      return setCreateMsg({ type: "error", text: "Password must be at least 6 characters." });
    }

    setCreating(true);
    try {
      const res  = await fetch(`${API_URL}/api/residents/admin-create`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) return setCreateMsg({ type: "error", text: data.error || "Failed to create." });

      setCreateMsg({ type: "success", text: "Account created and approved." });
      setForm(INITIAL_FORM);
      fetchResidents();
    } catch {
      setCreateMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setCreating(false);
    }
  };

  const pending  = residents.filter(r => r.status === "pending");
  const approved = residents.filter(r => r.status === "approved");
  const all      = residents;

  const TABS = [
    { id: "pending", label: "Pending",       badge: pending.length  },
    { id: "all",     label: "All Residents", badge: approved.length },
    { id: "create",  label: "Create Account",badge: null            },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Residents</h1>
          <p className="text-gray-500 text-sm mt-1">Manage resident accounts and approvals.</p>
        </div>
        <button
          onClick={fetchResidents}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} className={fetching ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Pending</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-600">{approved.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Approved</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{all.length}</p>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-colors
                ${tab === t.id
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/30"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              {t.id === "create" ? <UserPlus size={15} /> : null}
              {t.label}
              {t.badge !== null && t.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                  ${t.id === "pending" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* Pending tab */}
          {tab === "pending" && (
            fetching ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading…</p>
            ) : pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle size={32} className="opacity-30 mb-3" />
                <p className="text-sm font-medium">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pending.map(r => (
                  <ResidentRow
                    key={r.id}
                    resident={r}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={actionId}
                  />
                ))}
              </div>
            )
          )}

          {/* All residents tab */}
          {tab === "all" && (
            fetching ? (
              <p className="text-center text-gray-400 text-sm py-8">Loading…</p>
            ) : all.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Users size={32} className="opacity-30 mb-3" />
                <p className="text-sm font-medium">No residents yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {all.map(r => (
                  <ResidentRow
                    key={r.id}
                    resident={r}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={actionId}
                  />
                ))}
              </div>
            )
          )}

          {/* Create account tab */}
          {tab === "create" && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                Create an account directly on behalf of a resident. It will be immediately approved.
              </p>

              <AnimatePresence>
                {createMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0  }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-3 rounded-xl p-3.5 text-sm font-medium
                      ${createMsg.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-red-50 text-red-800 border border-red-200"}`}
                  >
                    {createMsg.type === "success"
                      ? <CheckCircle size={16} />
                      : <AlertCircle size={16} />
                    }
                    {createMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {[
                { name: "full_name", label: "Full Name",    icon: User,  type: "text", placeholder: "Juan Dela Cruz"          },
                { name: "phone",     label: "Phone Number", icon: Phone, type: "tel",  placeholder: "+63 9XX XXX XXXX"        },
                { name: "address",   label: "Home Address", icon: MapPin,type: "text", placeholder: "Block 4, Lot 12, Zone 3" },
              ].map(({ name, label, icon: Icon, type, placeholder }) => (
                <div key={name}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                    {label}
                  </label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={type}
                      value={form[name]}
                      onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                    />
                  </div>
                </div>
              ))}

              {/* Password */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="At least 6 characters"
                    className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors
                  ${creating
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
              >
                <UserPlus size={16} />
                {creating ? "Creating…" : "Create Account"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}