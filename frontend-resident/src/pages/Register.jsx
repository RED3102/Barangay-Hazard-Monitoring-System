import { useState } from "react";
import { User, Phone, MapPin, Lock, Eye, EyeOff, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../context/DataContext";

const INITIAL = { full_name: "", phone: "", address: "", password: "", confirm: "" };

export function Register({ onNavigateToSignIn }) {
  const [form,     setForm]     = useState(INITIAL);
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.full_name || !form.phone || !form.address || !form.password) {
      return setError("Please fill in all fields.");
    }
    if (form.password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    if (form.password !== form.confirm) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/residents/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          full_name: form.full_name.trim(),
          phone:     form.phone.trim(),
          address:   form.address.trim(),
          password:  form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) return setError(data.error || "Registration failed.");

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Pending screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-8 text-center bg-white">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6"
        >
          <Clock size={36} className="text-amber-500" />
        </motion.div>

        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0,  opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            Your request has been sent to the barangay office for review.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            You will be able to sign in once a barangay official approves your account.
          </p>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 text-left space-y-2">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Submitted details</p>
            <p className="text-sm text-amber-700 font-medium">{form.full_name}</p>
            <p className="text-sm text-amber-600">{form.phone}</p>
            <p className="text-sm text-amber-600">{form.address}</p>
          </div>

          <button
            onClick={onNavigateToSignIn}
            className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-colors hover:bg-gray-800 active:scale-95"
          >
            Back to Sign In
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  const fields = [
    { name: "full_name", label: "Full Name",       icon: User,   type: "text", placeholder: "Juan Dela Cruz"          },
    { name: "phone",     label: "Phone Number",    icon: Phone,  type: "tel",  placeholder: "+63 9XX XXX XXXX"        },
    { name: "address",   label: "Home Address",    icon: MapPin, type: "text", placeholder: "Block 4, Lot 12, Zone 3" },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
      {/* Header */}
      <div className="bg-blue-600 px-6 pt-10 pb-10 relative overflow-hidden rounded-b-[2.5rem]">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-40 blur-2xl" />
        <button
          onClick={onNavigateToSignIn}
          className="relative z-10 mb-4 p-2 bg-white/20 rounded-full text-white w-fit"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-blue-100 text-sm mt-1">Register as a barangay resident</p>
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

        {fields.map(({ name, label, icon: Icon, type, placeholder }) => (
          <div key={name}>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
              {label}
            </label>
            <div className="relative">
              <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
              />
            </div>
          </div>
        ))}

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
              placeholder="At least 6 characters"
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

        {/* Confirm Password */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type={showPw ? "text" : "password"}
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="Repeat your password"
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all"
            />
            {form.confirm && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {form.confirm === form.password
                  ? <CheckCircle size={18} className="text-emerald-500" />
                  : <span className="w-4 h-4 rounded-full bg-red-400 block" />
                }
              </span>
            )}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg mt-2
            ${loading
              ? "bg-gray-300 text-gray-400 shadow-none cursor-not-allowed"
              : "bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 active:scale-95"}`}
        >
          {loading ? "Submitting…" : "Submit Registration"}
        </motion.button>

        <p className="text-center text-sm text-gray-500 pb-6">
          Already have an account?{" "}
          <button onClick={onNavigateToSignIn} className="text-blue-600 font-semibold">
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}