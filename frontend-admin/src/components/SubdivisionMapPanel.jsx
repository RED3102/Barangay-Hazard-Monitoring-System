import { useState } from "react";
import { MapPin, ArrowLeft, Droplets, Flame, Activity, X } from "lucide-react";

const SUBDIVISIONS = [
  { id: "south-garden",    name: "South Garden Homes" },
  { id: "summerwind",      name: "Summerwind Village II" },
  { id: "cardinal",        name: "Cardinal Village" },
  { id: "molino",          name: "Molino Homes II" },
  { id: "garden-grove",    name: "Garden Grove Subdivision" },
  { id: "mangoville",      name: "Mangoville" },
  { id: "st-anthony",      name: "St. Anthony Village" },
  { id: "orchard",         name: "The Orchard Residential Estate" },
];

// Map image URLs for subdivisions that have a custom map
const SUBDIVISION_MAP_IMAGES = {
  summerwind: "Img/Summerwind Village 2.png",    // <-- Your actual image path here
  // Add more as you get them:
  // cardinal: "/images/cardinal-map.jpg",
};

/* Risk-level colors for the nodes */
const RISK_COLORS = {
  low:      { bg: "bg-green-500",  ring: "ring-green-300",  text: "text-green-700",  label: "Low" },
  medium:   { bg: "bg-yellow-500", ring: "ring-yellow-300", text: "text-yellow-700", label: "Medium" },
  high:     { bg: "bg-orange-500", ring: "ring-orange-300", text: "text-orange-700", label: "High" },
  critical: { bg: "bg-red-600",    ring: "ring-red-400",    text: "text-red-700",    label: "Critical" },
};

/* Each subdivision has 3 sensor nodes: positions are random-ish for now, 
   user will provide real map images later */
const SUBDIVISION_NODES = {
  summerwind: [
    { id: "node-flood",      type: "Flood Sensor",      icon: Droplets, risk: "medium",   top: "50%", left: "25%" },
    { id: "node-fire",       type: "Fire Sensor",       icon: Flame,    risk: "high",     top: "55%", left: "60%" },
    { id: "node-earthquake", type: "Earthquake Sensor", icon: Activity, risk: "low",      top: "85%", left: "28%" },
  ],
};

// Default nodes for subdivisions that don't have custom positions yet
const DEFAULT_NODES = [
  { id: "node-flood",      type: "Flood Sensor",      icon: Droplets, risk: "low",    top: "35%", left: "30%" },
  { id: "node-fire",       type: "Fire Sensor",       icon: Flame,    risk: "low",    top: "50%", left: "65%" },
  { id: "node-earthquake", type: "Earthquake Sensor", icon: Activity, risk: "low",    top: "68%", left: "40%" },
];

function SensorNode({ node }) {
  const riskStyle = RISK_COLORS[node.risk] || RISK_COLORS.low;
  const Icon = node.icon;
  const isPulsing = node.risk === "high" || node.risk === "critical";

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-1/2 group/node"
      style={{ top: node.top, left: node.left }}
    >
      {/* Pulse ring */}
      {isPulsing && (
        <div className={`absolute inset-0 w-12 h-12 -m-3 rounded-full ${riskStyle.bg} opacity-25 animate-ping pointer-events-none`} />
      )}

      {/* Node circle */}
      <div className={`relative w-8 h-8 ${riskStyle.bg} rounded-full border-[3px] border-white shadow-lg hover:scale-110 transition-transform cursor-pointer flex items-center justify-center ring-2 ${riskStyle.ring}`}>
        <Icon size={14} className="text-white" />
      </div>

      {/* Tooltip */}
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover/node:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xl pointer-events-none z-20 border border-gray-700">
        <p>{node.type}</p>
        <p className={`text-[10px] mt-0.5 ${riskStyle.text} font-semibold bg-white/10 rounded px-1`}>
          Risk: {riskStyle.label}
        </p>
      </div>
    </div>
  );
}

export function SubdivisionMapPanel() {
  const [selected, setSelected] = useState(null);

  return (
    <>
      {/* Sidebar section – subdivision list */}
      <div className="border-t border-gray-100 p-4 shrink-0">
        <div className="flex items-center gap-2 mb-3 px-2">
          <MapPin size={16} className="text-gray-500" />
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Subdivisions Map
          </h3>
        </div>

        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {SUBDIVISIONS.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelected(sub)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors group"
            >
              <MapPin size={13} className="text-gray-400 group-hover:text-blue-500 shrink-0" />
              <span className="truncate">{sub.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Full-screen overlay when a subdivision is selected */}
      {selected && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <ArrowLeft size={18} className="text-gray-600" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selected.name}</h2>
                  <p className="text-xs text-gray-500">Salitran III, Dasmariñas, Cavite</p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 rounded-xl hover:bg-gray-200 transition-colors"
              >
                <X size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Map area with nodes */}
            <div className="flex-1 relative bg-gradient-to-br from-emerald-50 via-blue-50 to-gray-100 overflow-hidden">
              {/* Actual map image for subdivisions that have one */}
              {SUBDIVISION_MAP_IMAGES[selected.id] ? (
                <img
                  src={SUBDIVISION_MAP_IMAGES[selected.id]}
                  alt={`Map of ${selected.name}`}
                  className="absolute inset-0 w-full h-full object-contain bg-white pointer-events-none"
                />
              ) : (
                /* Fallback placeholder for subdivisions without a custom map */
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-300">
                    <MapPin size={48} className="mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">Subdivision Map</p>
                    <p className="text-xs mt-1 opacity-60">{selected.name}</p>
                  </div>
                </div>
              )}

              {/* Grid lines for visual effect */}
              <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Sensor nodes */}
              {(SUBDIVISION_NODES[selected.id] || DEFAULT_NODES).map((node) => (
                <SensorNode key={node.id} node={node} />
              ))}


            </div>
          </div>
        </div>
      )}
    </>
  );
}