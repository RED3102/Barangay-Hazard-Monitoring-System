import { useState, useEffect, useRef } from "react";
import { Droplets, Flame, Earth, ShieldAlert, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useData } from "../context/DataContext";

function statusStyle(status) {
  switch (status) {
    case "Critical": return { label: "Critical", color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950",     icon: "text-red-500"     };
    case "Warning":  return { label: "Warning",  color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950", icon: "text-amber-500"   };
    default:         return { label: "Safe",     color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950", icon: "text-emerald-500" };
  }
}

export function Home() {
  const { loading, systemOnline, floodStatus, fireStatus, earthquakeStatus, dateLabel } = useData();
  const [showSos, setShowSos] = useState(false);
  const topSentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowSos(!entry.isIntersecting), { threshold: 0 });
    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    return () => { if (topSentinelRef.current) observer.unobserve(topSentinelRef.current); };
  }, []);

  const flood      = statusStyle(floodStatus);
  const fire       = statusStyle(fireStatus);
  const earthquake = statusStyle(earthquakeStatus);

  return (
    <div className="pb-24 min-h-[110vh] relative">
      <div ref={topSentinelRef} className="absolute top-0 h-1 w-full pointer-events-none" />

      <div className="bg-blue-600 px-6 pt-10 pb-16 rounded-b-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-blue-500 rounded-full opacity-50 blur-2xl" />
        <div className="absolute top-10 -left-10 w-32 h-32 bg-blue-400 rounded-full opacity-40 blur-xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-center text-white mb-6">
            <div>
              <p className="text-blue-100 text-sm font-medium">{dateLabel}</p>
              <h1 className="text-2xl font-bold tracking-tight">Hi, Resident 👋</h1>
              <p className="text-blue-200 text-xs mt-0.5">Salitran III Hazard Alert</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex justify-center items-center border border-white/20">
              <span className="text-white font-bold">R</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Local Environment</h3>
            <span className={`text-xs px-2 py-1 rounded-full font-semibold border flex items-center gap-1
              ${systemOnline ? "text-emerald-300 bg-white/15 border-white/20" : "text-gray-300 bg-white/10 border-white/10"}`}>
              <span className={`relative flex h-1.5 w-1.5 rounded-full ${systemOnline ? "bg-emerald-400" : "bg-gray-400"}`} />
              {loading ? "Connecting…" : systemOnline ? "Systems Online" : "No Signal"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-6 mb-6 relative z-20">
        <motion.button whileTap={{ scale: 0.95 }}
          className="w-full bg-red-600 rounded-3xl p-5 shadow-lg shadow-red-600/30 flex items-center justify-between border-[3px] border-white active:bg-red-700 transition-colors">
          <div>
            <h2 className="text-white font-bold text-lg mb-1 flex items-center gap-2"><ShieldAlert size={20} />Emergency SOS</h2>
            <p className="text-red-100 text-xs font-medium text-left">Tap to alert authorities</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full"><ArrowUpRight className="text-white" size={24} /></div>
        </motion.button>
      </div>

      <div className="px-6 space-y-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Flood Risk", style: flood, Icon: Droplets },
            { label: "Fire Risk",  style: fire,  Icon: Flame    },
          ].map(({ label, style, Icon }) => (
            <div key={label} className="bg-white dark:bg-gray-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center gap-3 transition-colors">
              <div className={`w-10 h-10 rounded-2xl ${style.bg} flex items-center justify-center ${style.icon}`}><Icon size={20} /></div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
                <p className={`font-bold text-sm mt-0.5 ${style.color}`}>{style.label}</p>
              </div>
            </div>
          ))}
          <div className="bg-white dark:bg-gray-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center text-center gap-3 col-span-2 mx-auto w-[calc(50%-0.375rem)] transition-colors">
            <div className={`w-10 h-10 rounded-2xl ${earthquake.bg} flex items-center justify-center ${earthquake.icon}`}><Earth size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Earthquake Risk</p>
              <p className={`font-bold text-sm mt-0.5 ${earthquake.color}`}>{earthquake.label}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSos && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-[60]">
            <motion.button whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ["0 0 0 0 rgba(239,68,68,0.7)", "0 0 0 12px rgba(239,68,68,0)", "0 0 0 0 rgba(239,68,68,0)"], scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="w-full bg-red-600 text-white rounded-2xl py-3.5 px-4 flex items-center justify-between shadow-lg active:bg-red-700 transition-colors border border-red-500 overflow-hidden relative">
              <motion.div animate={{ opacity: [0.1, 0.4, 0.1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-white pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-xl"><ShieldAlert size={20} className="text-white" /></div>
                <div className="text-left">
                  <span className="block font-bold text-sm tracking-wide">EMERGENCY SOS</span>
                  <span className="block text-[10px] text-red-100 font-medium">Tap to alert authorities immediately</span>
                </div>
              </div>
              <ArrowUpRight className="text-red-200 relative z-10" size={20} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}