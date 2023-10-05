import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TrafficDataPoint } from '@/types';

/** Time range options for chart filtering */
const TIME_RANGES = ['近1日', '近7日', '近30日', '近90日'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

interface TrafficChartProps {
  data: TrafficDataPoint[];
}

/**
 * Traffic chart showing download and upload bandwidth over time.
 * Includes a time range selector dropdown.
 */
export function TrafficChart({ data }: TrafficChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('近1日');

  return (
    <div>
      {/* Time range selector */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            <span className="text-gray-600">读取</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
            <span className="text-gray-600">写入</span>
          </span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">每秒读写 <strong className="text-gray-800">2268 次</strong></span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-500">IO延迟 <strong className="text-gray-800">0 ms</strong></span>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          {TIME_RANGES.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="downloadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="uploadGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
          />
          <Area
            type="monotone"
            dataKey="download"
            name="读取"
            stroke="#3b82f6"
            fill="url(#downloadGradient)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="upload"
            name="写入"
            stroke="#22c55e"
            fill="url(#uploadGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
