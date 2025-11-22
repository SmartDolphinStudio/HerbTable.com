import type { MetricCardData, ProcessInfo, TrafficDataPoint, DiskIODataPoint } from '@/types';

/** Mock metric card data for the top resource cards */
export const mockMetricCards: MetricCardData[] = [
  {
    id: 'load',
    label: '负载',
    value: 32,
    unit: '%',
    subtitle: '运行流畅',
    color: '#22c55e',
  },
  {
    id: 'cpu',
    label: 'CPU',
    value: 10,
    unit: '%',
    subtitle: '1024核心',
    color: '#22c55e',
  },
  {
    id: 'memory',
    label: '内存',
    value: 10,
    unit: '%',
    subtitle: '102GB / 1024GB',
    color: '#22c55e',
  },
  {
    id: 'storage',
    label: '储存',
    value: 32,
    unit: '%',
    subtitle: '160TB / 500TB',
    color: '#22c55e',
  },
  {
    id: 'gpu',
    label: 'GPU',
    value: 5,
    unit: '%',
    subtitle: '4GB / 80GB',
    color: '#22c55e',
  },
];

/** Mock CPU top 5 processes */
export const mockCpuProcesses: ProcessInfo[] = [
  { name: 'nginx', usage: 4.2 },
  { name: 'mysqld', usage: 3.1 },
  { name: 'node', usage: 2.5 },
  { name: 'redis-server', usage: 1.3 },
  { name: 'sshd', usage: 0.8 },
];

/** Mock memory top 5 processes */
export const mockMemoryProcesses: ProcessInfo[] = [
  { name: 'mysqld', usage: 18.5 },
  { name: 'java', usage: 12.3 },
  { name: 'node', usage: 8.7 },
  { name: 'nginx', usage: 4.2 },
  { name: 'redis-server', usage: 3.1 },
];

/** Mock GPU top 5 processes */
export const mockGpuProcesses: ProcessInfo[] = [
  { name: 'python3 (training)', usage: 3.2 },
  { name: 'Xorg', usage: 1.1 },
  { name: 'compiz', usage: 0.5 },
  { name: 'chrome', usage: 0.3 },
  { name: 'ffmpeg', usage: 0.1 },
];

/** Mock traffic chart data */
export const mockTrafficData: TrafficDataPoint[] = [
  { time: '00:00', download: 12, upload: 5 },
  { time: '02:00', download: 18, upload: 8 },
  { time: '04:00', download: 8, upload: 3 },
  { time: '06:00', download: 25, upload: 12 },
  { time: '08:00', download: 45, upload: 20 },
  { time: '10:00', download: 62, upload: 28 },
  { time: '12:00', download: 55, upload: 25 },
  { time: '14:00', download: 70, upload: 32 },
  { time: '16:00', download: 58, upload: 26 },
  { time: '18:00', download: 48, upload: 22 },
  { time: '20:00', download: 35, upload: 15 },
  { time: '22:00', download: 20, upload: 9 },
];

/** Mock disk IO chart data */
export const mockDiskIOData: DiskIODataPoint[] = [
  { time: '00:00', read: 120, write: 80 },
  { time: '02:00', read: 95, write: 60 },
  { time: '04:00', read: 60, write: 40 },
  { time: '06:00', read: 150, write: 110 },
  { time: '08:00', read: 280, write: 200 },
  { time: '10:00', read: 350, write: 260 },
  { time: '12:00', read: 310, write: 230 },
  { time: '14:00', read: 400, write: 300 },
  { time: '16:00', read: 320, write: 240 },
  { time: '18:00', read: 260, write: 190 },
  { time: '20:00', read: 180, write: 130 },
  { time: '22:00', read: 100, write: 70 },
];
