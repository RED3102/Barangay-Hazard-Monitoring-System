import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, X, Flame, Droplets, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HAZARD_STYLES = {
  fire:       { Icon: Flame,         bg: "bg-red-600",    label: "Fire Detected"       },
  flood:      { Icon: Droplets,      bg: "bg-blue-600",   label: "Flood Detected"      },
  earthquake: { Icon: Activity,      bg: "bg-amber-500",  label: "Earthquake Detected" },
  default:    { Icon: AlertTriangle, bg: "bg-gray-800",   label: "Hazard Detected"     },
};

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const pulseAt = (startTime) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(660, startTime + 0.15);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
      gain.gain.setValueAtTime(0.28, startTime + 0.25);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.40);
      osc.start(startTime);
      osc.stop(startTime + 0.42);
    };
    pulseAt(ctx.currentTime);
    pulseAt(ctx.currentTime + 0.6);
    pulseAt(ctx.currentTime + 1.2);
    setTimeout(() => ctx.close(), 2500);
  } catch (err) {
    console.warn("Alert sound unavailable:", err.message);
  }
}

export function AlertBanner({ alerts = [] }) {
  const [visible,       setVisible]       = useState(false);
  const [currentAlert,  setCurrentAlert]  = useState(null);
  const [queue,         setQueue]         = useState([]);
  const prevAlertIds                       = useRef(new Set());
  const dismissTimer                       = useRef(null);

  useEffect(() => {
    const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "pending");
    const newOnes = activeAlerts.filter(a => !prevAlertIds.current.has(a.id));
    if (newOnes.length > 0) setQueue(q => [...q, ...newOnes]);
    prevAlertIds.current = new Set(activeAlerts.map(a => a.id));
  }, [alerts]);

  useEffect(() => {
    if (queue.length > 0 && !visible) {
      const next = queue[0];
      setCurrentAlert(next);
      setQueue(q => q.slice(1));
      setVisible(true);
      playAlarmSound();
      clearTimeout(dismissTimer.current);
      dismissTimer.current = setTimeout(() => setVisible(false), 5000);
    }
  }, [queue, visible]);

  const dismiss = useCallback(() => {
    clearTimeout(dismissTimer.current);
    setVisible(false);
  }, []);

  if (!currentAlert) return null;

  const style = HAZARD_STYLES[currentAlert.hazard_type] || HAZARD_STYLES.default;
  const { Icon, bg, label } = style;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`fixed top-0 left-0 right-0 z-[9999] ${bg} text-white shadow-lg`}
        >
          <div className="px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="relative flex h-7 w-7 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30" />
                <span className="relative flex h-7 w-7 rounded-full bg-white/20 items-center justify-center">
                  <Icon size={16} />
                </span>
              </span>
              <div>
                <p className="font-bold text-xs tracking-wide uppercase">{label}</p>
                <p className="text-[10px] opacity-90">
                  Severity: <span className="font-semibold capitalize">{currentAlert.severity}</span>
                  {queue.length > 0 && <span className="ml-2 bg-white/20 rounded-full px-1.5 py-0.5">+{queue.length} more</span>}
                </p>
              </div>
            </div>
            <button onClick={dismiss} className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-0.5 bg-white/40 origin-left"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}