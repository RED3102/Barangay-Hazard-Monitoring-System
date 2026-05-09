import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, X, Flame, Droplets, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HAZARD_STYLES = {
  fire:       { Icon: Flame,         bg: "bg-red-600",    text: "text-white", label: "Fire Detected"       },
  flood:      { Icon: Droplets,      bg: "bg-blue-600",   text: "text-white", label: "Flood Detected"      },
  earthquake: { Icon: Activity,      bg: "bg-amber-500",  text: "text-white", label: "Earthquake Detected" },
  default:    { Icon: AlertTriangle, bg: "bg-gray-800",   text: "text-white", label: "Hazard Detected"     },
};

// Generates an urgent but not harsh 3-pulse alarm using Web Audio API
function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const pulseAt = (startTime) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      // Descending two-tone: 880Hz → 660Hz gives urgency without harshness
      osc.frequency.setValueAtTime(880, startTime);
      osc.frequency.setValueAtTime(660, startTime + 0.15);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.02);
      gain.gain.setValueAtTime(0.28, startTime + 0.25);
      gain.gain.linearRampToValueAtTime(0, startTime + 0.40);

      osc.start(startTime);
      osc.stop(startTime + 0.42);
    };

    // 3 pulses, 600ms apart
    pulseAt(ctx.currentTime);
    pulseAt(ctx.currentTime + 0.6);
    pulseAt(ctx.currentTime + 1.2);

    // Close context after sound finishes
    setTimeout(() => ctx.close(), 2500);
  } catch (err) {
    console.warn("Alert sound unavailable:", err.message);
  }
}

export function AlertBanner({ alerts = [] }) {
  const [visible,     setVisible]     = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [queue,       setQueue]       = useState([]);
  const prevAlertIds                   = useRef(new Set());
  const dismissTimer                   = useRef(null);

  // Detect new alerts that weren't in the previous render
  useEffect(() => {
    const activeAlerts = alerts.filter(a => a.status === "active" || a.status === "pending");
    const newOnes = activeAlerts.filter(a => !prevAlertIds.current.has(a.id));

    if (newOnes.length > 0) {
      setQueue(q => [...q, ...newOnes]);
    }

    // Update the known set
    prevAlertIds.current = new Set(activeAlerts.map(a => a.id));
  }, [alerts]);

  // Show the next queued alert
  useEffect(() => {
    if (queue.length > 0 && !visible) {
      const next = queue[0];
      setCurrentAlert(next);
      setQueue(q => q.slice(1));
      setVisible(true);
      playAlarmSound();

      // Auto-dismiss after 5 seconds
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
  const { Icon, bg, text, label } = style;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className={`fixed top-0 left-0 right-0 z-[9999] ${bg} ${text} shadow-lg`}
        >
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Pulsing icon */}
              <span className="relative flex h-8 w-8 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30" />
                <span className="relative flex h-8 w-8 rounded-full bg-white/20 items-center justify-center">
                  <Icon size={18} />
                </span>
              </span>
              <div>
                <p className="font-bold text-sm tracking-wide uppercase">{label}</p>
                <p className="text-xs opacity-90">
                  Node <span className="font-mono font-semibold">{currentAlert.node_id}</span>
                  {" "}— Severity: <span className="font-semibold capitalize">{currentAlert.severity}</span>
                  {queue.length > 0 && (
                    <span className="ml-2 bg-white/20 rounded-full px-2 py-0.5 text-[10px]">
                      +{queue.length} more
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={dismiss}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Dismiss alert"
            >
              <X size={16} />
            </button>
          </div>

          {/* Progress bar — shows time until auto-dismiss */}
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