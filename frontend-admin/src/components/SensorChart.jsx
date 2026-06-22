import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const LEGENDS = {
  "%": [
    { label: "Safe",     range: "10–20%",  color: "bg-green-400"  },
    { label: "Warning",  range: "30–40%",  color: "bg-yellow-400" },
    { label: "Critical", range: "50–100%", color: "bg-red-500"    },
  ],
  "ADC": [
    { label: "Normal",  range: "0–84",   color: "bg-green-400" },
    { label: "Warning", range: "85–100", color: "bg-yellow-400" },
    { label: "Alert",   range: "100+",   color: "bg-red-500"   },
  ],
  "0–5 scale": [
    { label: "Stable",   range: "0–1.0", color: "bg-green-400" },
    { label: "Moderate", range: "1–3.0", color: "bg-yellow-400" },
    { label: "Seismic",  range: "3.0+",  color: "bg-red-500"   },
  ],
};

export function SensorChart({ title, data, unit, color, domain }) {
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const chartData   = data.slice(-20);
  const legend      = LEGENDS[unit] || null;

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col transition-colors" style={{ minHeight: '300px' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
        <div className="text-right">
          <span className="text-[28px] font-bold text-gray-900 dark:text-white leading-none">
            {typeof latestValue === 'number' ? latestValue.toFixed(1) : latestValue}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 w-full" style={{ height: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            key={chartData.length + "-" + (chartData[chartData.length - 1]?.value ?? 0)}
            data={chartData}
            margin={{ top: 5, right: 8, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              dy={8}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              domain={domain || ['auto', 'auto']}
              allowDataOverflow={false}
            />
            <Tooltip
              contentStyle={{
                background: '#1f2937',
                border: 'none',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#f9fafb',
              }}
              labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
              formatter={(value) => [
                `${typeof value === 'number' ? value.toFixed(2) : value} ${unit}`,
                title,
              ]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {legend && (
        <div className="flex gap-3 mt-3 flex-wrap border-t border-gray-50 dark:border-gray-800 pt-3">
          {legend.map(r => (
            <div key={r.label} className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.color}`} />
              <span className="font-semibold text-gray-700 dark:text-gray-300">{r.label}</span>
              <span>{r.range}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}