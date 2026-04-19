import { BrainCircuit } from "lucide-react";

const RISK_STYLES = {
  critical: "bg-red-50 text-red-600",
  high:     "bg-orange-50 text-orange-600",
  medium:   "bg-yellow-50 text-yellow-600",
  warning:  "bg-amber-50 text-amber-600",
  low:      "bg-green-50 text-green-600",
};

export function AIDetectionPanel({ hazards = [], lastUpdated }) {
  const timeLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No data yet";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col shadow-sm h-full">
      <div className="space-y-8 flex-1">
        {hazards.map((hazard, index) => {
          const riskStyle =
            RISK_STYLES[hazard.riskLevel?.toLowerCase()] || "bg-gray-50 text-gray-600";

          return (
            <div key={index} className={index > 0 ? "pt-8 border-t border-gray-100" : ""}>
              <div className="flex items-center gap-2 mb-6">
                <BrainCircuit className="text-blue-600" size={20} />
                <h3 className="font-semibold text-gray-900">AI Hazard Detection</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 tracking-wider mb-1 uppercase">
                    Detected Hazard
                  </p>
                  <p className="text-lg text-gray-900 capitalize">
                    {hazard.hazardType || "No hazard detected"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-500 tracking-wider mb-2 uppercase">
                    Risk Level
                  </p>
                  <span className={`inline-block px-3 py-1 rounded-md text-sm font-medium capitalize ${riskStyle}`}>
                    {hazard.riskLevel || "—"}
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                      Confidence Level
                    </p>
                    <span className="text-sm text-gray-900 font-medium">
                      {hazard.confidence ?? 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${hazard.confidence ?? 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-500">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Last sensor reading: {timeLabel}
      </div>
    </div>
  );
}