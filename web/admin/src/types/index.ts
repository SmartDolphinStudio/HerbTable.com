export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'banned';
  createdAt: string;
  lastLogin: string;
}

export interface Post {
  id: number;
  title: string;
  author: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  views: number;
  likes: number;
  createdAt: string;
  thumbnail?: string;
}

export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  command: string;
  status: 'running' | 'stopped' | 'error';
  lastRun: string;
  nextRun: string;
}

export interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  engine: string;
  createdAt: string;
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  status: number;
  latency: string;
  calls: number;
}

export interface SystemMetric {
  cpu: number;
  memory: number;
  disk: number;
  network: { rx: number; tx: number };
  uptime: string;
  loadAvg: [number, number, number];
}

export interface ChatMessage {
  id: number;
  userId: number;
  username: string;
  content: string;
  type: 'text' | 'image' | 'video';
  timestamp: string;
  status: 'resolved' | 'pending' | 'closed';
}

export interface BackupItem {
  id: number;
  name: string;
  size: string;
  createdAt: string;
  type: 'full' | 'incremental';
  status: 'completed' | 'running' | 'failed';
}

export interface MetricCardData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

export interface ProcessInfo {
  name: string;
  cpu: number;
  memory: number;
  pid: number;
  status: string;
}

export interface TrafficDataPoint {
  time: string;
  rx: number;
  tx: number;
}

export interface DiskIODataPoint {
  time: string;
  read: number;
  write: number;
}
