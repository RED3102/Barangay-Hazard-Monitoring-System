import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export function SensorChart({ title, data, unit, color, domain }) {
  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;

  // Show only last 20 readings to keep chart readable
  const chartData = data.slice(-20);

  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col h-[300px] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{title}</h3>
        <div className="text-right">
          <span className="text-[28px] font-bold text-gray-900 dark:text-white leading-none">
            {typeof latestValue === 'number' ? latestValue.toFixed(1) : latestValue}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{unit}</span>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
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
                title
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
    </div>
  );
}