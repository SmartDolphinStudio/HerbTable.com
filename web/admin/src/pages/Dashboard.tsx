import { useState } from 'react';
import { MetricCard } from '@/components/MetricCard';
import { TrafficChart } from '@/components/TrafficChart';
import { DiskIOChart } from '@/components/DiskIOChart';
import { mockMetricCards, mockTrafficData, mockDiskIOData } from '@/data/mockData';

/**
 * Dashboard page displaying system metrics and charts.
 * Shows resource usage cards, overview stats, and traffic/disk IO charts.
 */
export function DashboardPage() {
  const [activePopupId, setActivePopupId] = useState<string | null>(null);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">系统概览</h1>
        <p className="mt-1 text-sm text-gray-500">实时监控服务器资源使用情况</p>
      </div>

      {/* Metric Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {mockMetricCards.map((card) => (
          <MetricCard
            key={card.id}
            data={card}
            activePopupId={activePopupId}
            onSetActivePopup={setActivePopupId}
          />
        ))}
      </div>

      {/* Overview Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">网站</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">数据库</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">安全风险</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">17</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">备忘录</h3>
          <p className="mt-2 text-sm text-gray-500">当前内容为空，点击编辑</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">流量</h3>
          <TrafficChart data={mockTrafficData} />
        </div>
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">磁盘IO</h3>
          <DiskIOChart data={mockDiskIOData} />
        </div>
      </div>
    </div>
  );
}
