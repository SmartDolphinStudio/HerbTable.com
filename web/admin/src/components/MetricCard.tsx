import { useState, useRef, useCallback, useEffect } from 'react';
import RingProgress from './RingProgress';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import type { MetricCardData, ProcessInfo } from '@/types';
import {
  mockCpuProcesses,
  mockMemoryProcesses,
  mockGpuProcesses,
} from '@/data/mockData';

interface MetricCardProps {
  data: MetricCardData;
  /** ID of the currently active popup (managed by parent) */
  activePopupId: string | null;
  /** Callback to set the active popup */
  onSetActivePopup: (id: string | null) => void;
}

/**
 * Metric card with ring progress indicator.
 * Popup visibility is controlled by parent to prevent overlapping popups.
 */
export function MetricCard({ data, activePopupId, onSetActivePopup }: MetricCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  const showPopup = activePopupId === data.id;

  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    onSetActivePopup(data.id);
  }, [data.id, onSetActivePopup]);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    // Delay hide to allow mouse to move into popup
    setTimeout(() => {
      if (!isHoveredRef.current && activePopupId === data.id) {
        onSetActivePopup(null);
      }
    }, 200);
  }, [data.id, activePopupId, onSetActivePopup]);

  const handlePopupEnter = useCallback(() => {
    isHoveredRef.current = true;
  }, []);

  const handlePopupLeave = useCallback(() => {
    isHoveredRef.current = false;
    onSetActivePopup(null);
  }, [onSetActivePopup]);

  useEffect(() => {
    return () => {
      isHoveredRef.current = false;
    };
  }, []);

  /** Determine which action button to show */
  const getActionButton = () => {
    switch (data.id) {
      case 'memory':
        return (
          <button className="rounded bg-brand-600 px-4 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            立即释放
          </button>
        );
      case 'storage':
        return (
          <button className="rounded bg-brand-600 px-4 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            立即清理
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-500">{data.label}</h3>
            <p className="mt-1 text-lg font-semibold text-gray-900 truncate">{data.subtitle}</p>
          </div>
          <RingProgress percentage={data.value} color={data.color} size={100} />
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-96 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black/5 max-h-[70vh] overflow-y-auto"
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{data.label}详情</span>
            <button
              onClick={() => onSetActivePopup(null)}
              className="rounded p-1 hover:bg-gray-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          {getActionButton() && (
            <div className="mb-3 flex justify-end">{getActionButton()}</div>
          )}
          {getPopupContent(data)}
        </div>
      )}
    </div>
  );
}

/** Render popup content based on metric type */
function getPopupContent(data: MetricCardData) {
  switch (data.id) {
    case 'load':
      return <LoadDetail value={data.value} />;
    case 'cpu':
      return <CpuDetail value={data.value} />;
    case 'memory':
      return <MemoryDetail value={data.value} />;
    case 'storage':
      return <StorageDetail value={data.value} />;
    case 'gpu':
      return <GpuDetail value={data.value} />;
    default:
      return null;
  }
}

/* ─── Collapsible Section ─── */

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t pt-3">
      <button
        className="flex w-full cursor-pointer items-center justify-between py-2 hover:text-gray-700 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-medium text-sm">{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  );
}

/* ─── Process Table ─── */

interface ProcessTableProps {
  processes: ProcessInfo[];
  type: 'cpu' | 'memory' | 'gpu';
}

function ProcessTable({ processes, type }: ProcessTableProps) {
  const getUsageLabel = () => {
    switch (type) {
      case 'cpu':
        return 'CPU占用率';
      case 'memory':
        return '内存使用率';
      case 'gpu':
        return 'GPU占用率';
    }
  };

  return (
    <div className="mt-2 overflow-hidden rounded border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">进程名称</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{getUsageLabel()}</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {processes.map((process, index) => (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 text-sm text-gray-900">{process.name}</td>
              <td className="px-3 py-2 text-sm text-gray-900">{process.usage}%</td>
              <td className="px-3 py-2 text-sm">
                <button className="text-brand-600 hover:text-brand-700 transition-colors">结束</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Detail Panels ─── */

function LoadDetail({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">负载占用{value}%</div>
      <CollapsibleSection title="基础信息">
        <div className="space-y-2 text-sm text-gray-600">
          <p>系统负载: {value}%</p>
          <p>运行状态: 正常</p>
          <p>平均负载: 0.15, 0.12, 0.08</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function CpuDetail({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">占用{value}%</div>
      <CollapsibleSection title="基础信息">
        <div className="space-y-2 text-sm text-gray-600">
          <p>处理器: Intel Xeon Platinum 8490H @ 1.9GHz</p>
          <p>核心数: 1024核心 (512物理核心, 1024逻辑线程)</p>
          <p>架构: x86_64 (Sapphire Rapids)</p>
          <p>缓存: L1 48KB/核心, L2 2MB/核心, L3 105MB</p>
          <p>制程: Intel 7 (10nm ESF)</p>
          <p>TDP: 350W</p>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="核心使用率" defaultOpen={false}>
        <div className="space-y-1 text-sm text-gray-600">
          <div className="grid grid-cols-3 gap-2">
            <p>核心 1-8: 12.3%</p>
            <p>核心 9-16: 8.7%</p>
            <p>核心 17-24: 15.1%</p>
          </div>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="CPU占用率top5的进程信息" defaultOpen={false}>
        <ProcessTable processes={mockCpuProcesses} type="cpu" />
      </CollapsibleSection>
    </div>
  );
}

function MemoryDetail({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">占用{value}%</div>
      <CollapsibleSection title="内存信息">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-2">
            <p>空闲内存: 512 GB</p>
            <p>已用: 102 GB</p>
            <p>总内存: 1024 GB</p>
            <p>共享: 2 GB</p>
            <p>可分配内存: 768 GB</p>
            <p>buff/cache: 256/64 GB</p>
          </div>
          <p className="text-xs text-gray-400 mt-2">类型: DDR5-4800 ECC Registered</p>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="内存使用率top5的进程信息" defaultOpen={false}>
        <ProcessTable processes={mockMemoryProcesses} type="memory" />
      </CollapsibleSection>
    </div>
  );
}

function StorageDetail({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">容量占用{value}%</div>
      <CollapsibleSection title="基础信息">
        <div className="space-y-2 text-sm text-gray-600">
          <p>挂载点: /data (/data)</p>
          <p>共: 500 TB, 可用: 340 TB, 已用: 160 TB</p>
          <p>文件系统: /dev/nvme0n1p1</p>
          <p>类型: XFS, 系统占用: 32.00%</p>
          <p className="text-xs text-gray-400 mt-1">RAID 10 · NVMe SSD · Samsung PM9A3</p>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="Inode信息" defaultOpen={false}>
        <div className="space-y-2 text-sm text-gray-600">
          <p>总数: 5368709120</p>
          <p>已用: 125829120</p>
          <p>可用: 5242880000</p>
          <p>使用率: 2.34%</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function GpuDetail({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-500">占用{value}%</div>
      <CollapsibleSection title="基础信息">
        <div className="space-y-2 text-sm text-gray-600">
          <p>显卡型号: NVIDIA H100 80GB HBM3</p>
          <p>显存: 80 GB HBM3</p>
          <p>驱动版本: 535.129.03</p>
          <p>CUDA版本: 12.2</p>
          <p>温度: 42°C</p>
          <p>功耗: 180W / 700W</p>
          <p className="text-xs text-gray-400 mt-1">PCIe Gen5 x16 · NVLink 4.0</p>
        </div>
      </CollapsibleSection>
      <CollapsibleSection title="GPU占用率top5的进程信息" defaultOpen={false}>
        <ProcessTable processes={mockGpuProcesses} type="gpu" />
      </CollapsibleSection>
    </div>
  );
}
