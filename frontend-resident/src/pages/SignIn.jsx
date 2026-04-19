import { useState } from "react";
import { Phone, Lock, Eye, EyeOff, Clock, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../context/DataContext";

export function SignIn({ onLogin, onNavigateToRegister }) {
  const [form,    setForm]    = useState({ phone: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [blocked, setBlocked] = useState(null); // "pending" | "rejected"

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBlocked(null);

    if (!form.phone || !form.password) {
      return setError("Please enter your phone number and password.");
    }

    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ phone: form.phone.trim(), password: form.password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.status === "pending")  return setBlocked("pending");
        if (data.status === "rejected") return setBlocked("rejected");
        return setError(data.error || "Sign in failed.");
      }

      // Store token and pass user up to App
      localStorage.setItem("resident_token", data.token);
      localStorage.setItem("resident_profile", JSON.stringify({
        name:    data.user.name,
        phone:   data.user.phone,
        address: data.user.address,
        role:    data.user.role,
      }));

      onLogin(data.user, data.token);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Blocked screens ─────────────────────────────────────────────────────────
  if (blocked) {
    const isPending = blocked === "pending";
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-white">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isPending ? "bg-amber-50" : "bg-red-50"}`}>
          {isPending
            ? <Clock size={36} className="text-amber-500" />
            : <XCircle size={36} className="text-red-500" />
          }
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">
          {isPending ? "Account Pending Approval" : "Account Not Approved"}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          {isPending
            ? "Your registration is still being reviewed by a barangay official. Please check back later."
            : "Your registration was not approved. Please visit the barangay office for assistance."
          }
        </p>
        <button
          onClick={() => setBlocked(null)}
          className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl transition-colors hover:bg-gray-800"
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  // ── Sign in form ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="bg-blue-600 px-6 pt-14 pb-14 relative overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500 rounded-full opacity-50 blur-2xl" />
        <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-400 rounded-full opacity-40 blur-xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-1">Welcome Back</h1>
          <p className="text-blue-100 text-sm">Barangay Hazard Monitoring</p>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 space-y-5">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0  }}
              exit={{ opacity: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-700 font-medium"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phone */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="+63 9XX XXX XXXX"
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showPw ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3.5 pl-11 pr-11 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg mt-2
            ${loading
              ? "bg-gray-300 text-gray-400 shadow-none cursor-not-allowed"
              : "bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700"}`}
        >
          {loading ? "Signing in…" : "Sign In"}
        </motion.button>

        <p className="text-center text-sm text-gray-500 pb-6">
          Not yet registered?{" "}
          <button onClick={onNavigateToRegister} className="text-blue-600 font-semibold">
            Create Account
          </button>
        </p>
      </div>
    </div>
  );
}