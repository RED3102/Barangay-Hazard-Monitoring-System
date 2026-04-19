import { Send, MapPin, Camera, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "../context/DataContext";

const HAZARD_TYPES = [
  { id: "flood",      label: "Flood",      active: "border-blue-500 bg-blue-50 text-blue-700"   },
  { id: "fire",       label: "Fire",       active: "border-red-500 bg-red-50 text-red-700"       },
  { id: "earthquake", label: "Earthquake", active: "border-amber-500 bg-amber-50 text-amber-700" },
];

const INITIAL_FORM = {
  hazard_type: "flood",
  location:    "",
  description: "",
  photo:       null,
};

export function Report() {
  const [form,        setForm]        = useState(INITIAL_FORM);
  const [status,      setStatus]      = useState("idle"); // idle | loading | success | error
  const [errorMsg,    setErrorMsg]    = useState("");
  const fileInputRef                  = useRef(null);

  const handleSubmit = async () => {
    if (!form.location.trim()) {
      setErrorMsg("Please enter a hazard location.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    try {
      const body = {
        hazard_type: form.hazard_type,
        location:    form.location.trim(),
        description: form.description.trim(),
        source:      "resident_report",
      };

      const res = await fetch(`${API_URL}/api/reports`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      setStatus("success");
      setForm(INITIAL_FORM);

      // Reset back to idle after 3 seconds
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("Report submit failed:", err);
      setErrorMsg("Failed to submit. Please try again.");
      setStatus("error");
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setForm(f => ({ ...f, photo: file }));
  };

  return (
    <div className="flex flex-col h-full bg-white pb-6">
      <div className="px-6 pt-10 pb-4 shadow-sm z-10 relative">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Incident</h1>
        <p className="text-sm text-gray-500">Help the community by reporting hazards.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 font-sans">
        <div className="space-y-6">

          {/* Success banner */}
          <AnimatePresence>
            {status === "success" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4"
              >
                <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Report submitted!</p>
                  <p className="text-xs text-emerald-600">Barangay officials have been notified.</p>
                </div>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4"
              >
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-semibold text-red-800">{errorMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Incident Type */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Incident Type</label>
            <div className="flex gap-3">
              {HAZARD_TYPES.map(h => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, hazard_type: h.id }))}
                  className={`flex-1 py-3 px-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
                    form.hazard_type === h.id
                      ? h.active
                      : "border-gray-100 bg-white text-gray-600"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Hazard Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="Street or Landmark..."
                className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!navigator.geolocation) return;
                navigator.geolocation.getCurrentPosition(pos => {
                  setForm(f => ({
                    ...f,
                    location: `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`,
                  }));
                });
              }}
              className="text-blue-600 text-xs font-semibold flex items-center gap-1.5 ml-1"
            >
              <MapPin size={14} /> Use Current Location
            </button>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
            <textarea
              rows="3"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Provide details about the hazard..."
              className="w-full bg-gray-50 border border-gray-200 text-sm rounded-2xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none font-medium"
            />
          </div>

          {/* Photo */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-900">Photo Evidence <span className="text-gray-400 font-normal">(Optional)</span></label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <div
              onClick={handlePhotoClick}
              className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-gray-500 bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {form.photo ? (
                <>
                  <CheckCircle size={28} className="mb-2 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700">{form.photo.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Tap to change</p>
                </>
              ) : (
                <>
                  <Camera size={32} className="mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Tap to upload a photo</p>
                </>
              )}
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSubmit}
            disabled={status === "loading" || status === "success"}
            className={`w-full font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 transition-all shadow-lg active:scale-95
              ${status === "loading" || status === "success"
                ? "bg-gray-300 text-gray-500 shadow-none cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-gray-800 shadow-gray-900/20"}`}
          >
            {status === "loading" ? (
              <>
                <Loader size={18} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send size={18} />
                Submit Report
              </>
            )}
          </motion.button>

        </div>
      </div>
    </div>
  );
}