import { useState, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Flame, Droplets, Activity, AlertTriangle, RefreshCw, Brain } from "lucide-react";
import { API_URL } from "../config";

function getToken() {
  return localStorage.getItem("admin_token") || "";
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

const HAZARD_COLORS = {
  flood:      "#2563eb",
  fire:       "#dc2626",
  earthquake: "#f59e0b",
};

const HAZARD_ICONS = {
  flood:      Droplets,
  fire:       Flame,
  earthquake: Activity,
};

// Build prediction message from frequency data
function buildPrediction(rows, currentMonth) {
  if (!rows || rows.length === 0) {
    return "Not enough data to generate predictions yet. Continue monitoring to build historical data.";
  }

  // Group by hazard type and average monthly counts
  const grouped = {};
  rows.forEach(r => {
    if (!grouped[r.hazard_type]) grouped[r.hazard_type] = [];
    grouped[r.hazard_type].push(Number(r.count));
  });

  const predictions = Object.entries(grouped).map(([hazard, counts]) => {
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const current = currentMonth.find(c => c.hazard_type === hazard)?.count || 0;
    return { hazard, avg: Math.round(avg), current: Number(current) };
  }).sort((a, b) => b.avg - a.avg);

  if (predictions.length === 0) return "No hazard patterns detected yet.";

  const top = predictions[0];
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    .toLocaleString("en-PH", { month: "long", year: "numeric" });
  const thisMonth = now.toLocaleString("en-PH", { month: "long" });

  let msg = `Based on the past 3 months of data, ${top.hazard} incidents are the most frequent with an average of ${top.avg} alert(s) per month. `;

  if (top.current > top.avg) {
    msg += `This month (${thisMonth}) already has ${top.current} ${top.hazard} alert(s), which is above the monthly average — heightened monitoring is recommended. `;
  } else if (top.current === 0) {
    msg += `No ${top.hazard} alerts have been recorded this month yet. `;
  }

  msg += `Barangay officials should prepare contingency measures for ${top.hazard} hazards heading into ${nextMonth}.`;

  if (predictions.length > 1) {
    const second = predictions[1];
    msg += ` ${second.hazard.charAt(0).toUpperCase() + second.hazard.slice(1)} incidents also occur regularly (avg ${second.avg}/month) and should not be overlooked.`;
  }

  return msg;
}

// Format month string from YYYY-MM to short label
function formatMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleString("en-PH", { month: "short", year: "2-digit" });
}

export function AnalyticsPage() {
  const [summary,    setSummary]    = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, predRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics/summary`,    { headers: authHeaders() }),
        fetch(`${API_URL}/api/analytics/prediction`, { headers: authHeaders() }),
      ]);
      const [summaryData, predData] = await Promise.all([
        summaryRes.json(),
        predRes.json(),
      ]);
      setSummary(summaryData);
      setPrediction(predData);
    } catch (err) {
      setError("Failed to load analytics data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Build monthly bar chart data
  const monthlyChartData = (() => {
    if (!summary?.monthly) return [];
    const months = [...new Set(summary.monthly.map(r => r.month))].sort();
    return months.map(month => {
      const row = { month: formatMonth(month) };
      ["flood", "fire", "earthquake"].forEach(h => {
        const found = summary.monthly.find(r => r.month === month && r.hazard_type === h);
        row[h] = found ? Number(found.count) : 0;
      });
      return row;
    });
  })();

  // Daily trend chart data
  const dailyChartData = summary?.dailyTrend?.map(r => ({
    date:  new Date(r.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" }),
    count: Number(r.count),
  })) || [];

  // Total counts for stat cards
  const totalsByType = {};
  summary?.totals?.forEach(r => { totalsByType[r.hazard_type] = Number(r.count); });
  const totalAlerts = summary?.totals?.reduce((a, b) => a + Number(b.count), 0) || 0;

  const predictionText = prediction
    ? buildPrediction(prediction.rows, prediction.currentMonth)
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 gap-2">
        <RefreshCw size={18} className="animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Hazard frequency analysis and trend monitoring.</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{totalAlerts}</h3>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl text-gray-600">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">All time</p>
        </div>

        {["flood", "fire", "earthquake"].map(hazard => {
          const Icon = HAZARD_ICONS[hazard];
          const color = hazard === "flood" ? "blue" : hazard === "fire" ? "red" : "amber";
          return (
            <div key={hazard} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 capitalize">{hazard} Alerts</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    {totalsByType[hazard] || 0}
                  </h3>
                </div>
                <div className={`bg-${color}-50 p-2.5 rounded-xl text-${color}-600`}>
                  <Icon size={20} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">All time</p>
            </div>
          );
        })}
      </div>

      {/* AI Prediction Panel */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-3 rounded-xl flex-shrink-0">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
              <TrendingUp size={18} />
              AI-Based Hazard Prediction
            </h3>
            <p className="text-blue-100 text-sm leading-relaxed">
              {predictionText || "Collecting data for analysis…"}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Hazard Frequency Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Monthly Hazard Frequency</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 6 months — alerts per hazard type</p>
        </div>
        <div className="p-5">
          {monthlyChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="flood"      name="Flood"      fill={HAZARD_COLORS.flood}      radius={[4,4,0,0]} />
                <Bar dataKey="fire"       name="Fire"       fill={HAZARD_COLORS.fire}       radius={[4,4,0,0]} />
                <Bar dataKey="earthquake" name="Earthquake" fill={HAZARD_COLORS.earthquake} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-50 bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Daily Alert Trend</h3>
          <p className="text-xs text-gray-500 mt-0.5">Last 30 days — total alerts per day</p>
        </div>
        <div className="p-5">
          {dailyChartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              No data available yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailyChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Alerts"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status Breakdown + Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Alert Status Breakdown</h3>
          </div>
          <div className="p-5 space-y-3">
            {summary?.statusBreakdown?.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            )}
            {summary?.statusBreakdown?.map(row => {
              const pct = totalAlerts > 0 ? Math.round((Number(row.count) / totalAlerts) * 100) : 0;
              const colors = {
                pending:  "bg-amber-500",
                verified: "bg-emerald-500",
                resolved: "bg-blue-500",
                rejected: "bg-red-400",
              };
              return (
                <div key={row.status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 capitalize">{row.status}</span>
                    <span className="text-gray-500">{row.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${colors[row.status] || "bg-gray-400"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900">Peak Alert Hours</h3>
            <p className="text-xs text-gray-500 mt-0.5">Top 5 hours with most alerts</p>
          </div>
          <div className="p-5 space-y-3">
            {summary?.peakHours?.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No data yet</p>
            )}
            {summary?.peakHours?.map((row, i) => {
              const hour = Number(row.hour);
              const label = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:00 ${hour < 12 ? "AM" : "PM"}`;
              const maxCount = Number(summary.peakHours[0]?.count || 1);
              const pct = Math.round((Number(row.count) / maxCount) * 100);
              return (
                <div key={row.hour}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">#{i + 1} — {label}</span>
                    <span className="text-gray-500">{row.count} alert{row.count > 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}