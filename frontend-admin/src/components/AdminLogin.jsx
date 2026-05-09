import { useState } from "react";
import { ShieldAlert, User, Lock, Eye, EyeOff, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDarkMode } from "../hooks/useDarkMode";

const API_URL = import.meta.env.VITE_API_URL || "https://hazard-backend-8dtj.onrender.com";

export function AdminLogin({ onLogin }) {
  const [form,    setForm]    = useState({ username: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [isDark,  setIsDark]  = useDarkMode();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.username || !form.password) {
      return setError("Please enter your username and password.");
    }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/auth/admin/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: form.username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Invalid credentials.");
      localStorage.setItem("admin_token", data.token);
      onLogin(data.user);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
      {/* Dark mode toggle */}
      <button
        onClick={() => setIsDark(v => !v)}
        className="absolute top-4 right-4 p-2.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
        title="Toggle dark mode"
      >
        {isDark ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3.5 rounded-2xl text-white mb-4 shadow-lg shadow-blue-600/30">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight text-center leading-tight">
            Barangay Salitran III
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 text-center">
            Hazard Monitoring System — Admin
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sign In</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Barangay officials only</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0 }}
                className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400 font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="admin"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Your password"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl py-3 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
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
              type="submit"
              disabled={loading}
              className={`w-full font-semibold py-3 rounded-xl transition-colors mt-2
                ${loading
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"}`}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Barangay Salitran III, Dasmariñas City, Cavite
        </p>
      </div>
    </div>
  );
}