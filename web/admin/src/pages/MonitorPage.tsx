import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RefreshCw, Trash2, X, AlertCircle } from 'lucide-react';

/** Time range options */
const TIME_RANGES = ['昨天', '今天', '最近七天', '最近30天', '全部'] as const;
type TimeRange = (typeof TIME_RANGES)[number];

/** Generate smooth mock chart data using sine waves + small noise */
function generateChartData(points: number) {
  const data = [];
  for (let i = 0; i < points; i++) {
    const t = i / points;
    data.push({
      time: `${String(Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}`,
      cpu: 25 + Math.sin(t * Math.PI * 4) * 10 + Math.sin(t * Math.PI * 8) * 3,
      memory: 55 + Math.sin(t * Math.PI * 2) * 8 + Math.cos(t * Math.PI * 6) * 2,
      disk: 35 + Math.sin(t * Math.PI * 3) * 5 + Math.cos(t * Math.PI * 5) * 2,
      network: 45 + Math.sin(t * Math.PI * 5) * 15 + Math.cos(t * Math.PI * 3) * 5,
      load1: 1.2 + Math.sin(t * Math.PI * 4) * 0.6 + Math.sin(t * Math.PI * 10) * 0.1,
      load5: 0.8 + Math.sin(t * Math.PI * 3) * 0.4 + Math.cos(t * Math.PI * 7) * 0.05,
      load15: 0.5 + Math.sin(t * Math.PI * 2) * 0.2 + Math.cos(t * Math.PI * 5) * 0.03,
    });
  }
  return data;
}

/**
 * Monitoring page.
 * Features: load charts, resource usage charts, time range selector, save days setting, cleanup confirmation.
 */
export function MonitorPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('今天');
  const [saveDays, setSaveDays] = useState(30);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupInput, setCleanupInput] = useState('');
  const [cleanupSuccess, setCleanupSuccess] = useState(false);

  const chartData = generateChartData(120);

  const handleCleanupConfirm = () => {
    if (cleanupInput === 'Yes') {
      setCleanupSuccess(true);
      setTimeout(() => {
        setShowCleanupModal(false);
        setCleanupInput('');
        setCleanupSuccess(false);
      }, 2000);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">监控</h1>
          <p className="mt-1 text-sm text-gray-500">系统资源使用情况和性能指标监控。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">保存天数:</label>
            <input
              type="number"
              value={saveDays}
              onChange={(e) => setSaveDays(Math.max(1, Math.min(9999, parseInt(e.target.value) || 1)))}
              min={1}
              max={9999}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
            />
          </div>
          <div className="text-sm text-gray-600">
            监控日志大小: <span className="font-medium">19.00 KB</span>
          </div>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            清理
          </button>
        </div>
      </div>



      {/* Charts */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Load Chart */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">平均负载</h3>
            <div className="flex items-center gap-4">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
                  <span className="text-gray-600">1分钟</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500" />
                  <span className="text-gray-600">5分钟</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="text-gray-600">15分钟</span>
                </span>
              </div>
              <div className="flex gap-1">
                {TIME_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`rounded px-3 py-1.5 text-sm transition-colors ${
                      timeRange === range
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">资源使用率</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="cpu" name="CPU" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="memory" name="内存" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="disk" name="磁盘" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="network" name="网络" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">负载详情</h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <Tooltip />
                  <Line type="monotone" dataKey="load1" name="1分钟" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="load5" name="5分钟" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="load15" name="15分钟" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Individual Resource Charts */}
        <div className="grid grid-cols-2 gap-6">
          {['CPU', '内存', '磁盘', '网络'].map((resource) => (
            <div key={resource} className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{resource}</h3>
                <div className="flex gap-1">
                  {TIME_RANGES.slice(0, 4).map((range) => (
                    <button
                      key={range}
                      className={`rounded px-2 py-1 text-xs transition-colors ${
                        range === '今天'
                          ? 'bg-brand-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={resource.toLowerCase()}
                    name="百分比"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>

      {/* Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            {cleanupSuccess ? (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">清理成功</h3>
              </div>
            ) : (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">清空记录</h3>
                  <button
                    onClick={() => setShowCleanupModal(false)}
                    className="rounded p-1 hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-orange-50 p-4">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-orange-600" />
                  <p className="text-sm text-orange-800">您真的要清空所有监控记录吗？</p>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    请输入 Yes 确认
                  </label>
                  <input
                    type="text"
                    value={cleanupInput}
                    onChange={(e) => setCleanupInput(e.target.value)}
                    placeholder="Yes"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowCleanupModal(false)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCleanupConfirm}
                    disabled={cleanupInput !== 'Yes'}
                    className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确定
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
