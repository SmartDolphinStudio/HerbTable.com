import { useState, useMemo } from 'react';
import { RefreshCw, X, ChevronLeft, ChevronRight, Search, Eye, Trash2, RotateCcw, Wifi, Server, Key, HardDrive, Users, Clock, Copy } from 'lucide-react';

/* ─── 类型定义 ─── */

type RedisKeyType = 'string' | 'hash' | 'list' | 'set' | 'zset';

interface RedisKey {
  name: string;
  namespace: string;
  type: RedisKeyType;
  ttl: number; // -1 表示永久
  size: number; // 字节
  lastAccess: string; // ISO 时间
  encoding: string;
  value: string | string[] | Record<string, string> | [string, number][];
}

/* ─── 统计卡片数据 ─── */

const redisStats = [
  { label: '连接状态', value: '已连接', unit: '', color: '#22c55e', icon: Wifi },
  { label: '版本', value: '7.2.4', unit: '', color: '#3b82f6', icon: Server },
  { label: '键数量', value: '15,847', unit: '个', color: '#8b5cf6', icon: Key },
  { label: '内存使用', value: '256.8', unit: 'MB', color: '#f59e0b', icon: HardDrive },
  { label: '客户端连接数', value: '23', unit: '个', color: '#ec4899', icon: Users },
  { label: '运行时间', value: '45天12', unit: '小时', color: '#06b6d4', icon: Clock },
];

/* ─── 模拟 Redis 键数据（30 条） ─── */

const mockRedisKeys: RedisKey[] = [
  // user 命名空间
  { name: 'user:1001:profile', namespace: 'user', type: 'hash', ttl: -1, size: 1240, lastAccess: '2026-07-28T10:32:00Z', encoding: 'ziplist', value: { name: '张三', age: '28', email: 'zhangsan@example.com', role: 'admin' } },
  { name: 'user:1001:token', namespace: 'user', type: 'string', ttl: 7200, size: 256, lastAccess: '2026-07-28T10:30:00Z', encoding: 'raw', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  { name: 'user:1002:profile', namespace: 'user', type: 'hash', ttl: -1, size: 980, lastAccess: '2026-07-28T09:15:00Z', encoding: 'ziplist', value: { name: '李四', age: '35', email: 'lisi@example.com', role: 'user' } },
  { name: 'user:1002:token', namespace: 'user', type: 'string', ttl: 3600, size: 256, lastAccess: '2026-07-28T09:14:00Z', encoding: 'raw', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
  { name: 'user:online:set', namespace: 'user', type: 'set', ttl: -1, size: 512, lastAccess: '2026-07-28T10:33:00Z', encoding: 'hashtable', value: ['1001', '1002', '1005', '1008', '1012'] },
  // session 命名空间
  { name: 'session:abc123', namespace: 'session', type: 'hash', ttl: 1800, size: 2048, lastAccess: '2026-07-28T10:31:00Z', encoding: 'ziplist', value: { userId: '1001', ip: '192.168.1.100', ua: 'Mozilla/5.0', loginAt: '1690512000' } },
  { name: 'session:def456', namespace: 'session', type: 'hash', ttl: 1200, size: 1856, lastAccess: '2026-07-28T10:28:00Z', encoding: 'ziplist', value: { userId: '1002', ip: '10.0.0.55', ua: 'Chrome/120', loginAt: '1690511800' } },
  { name: 'session:ghi789', namespace: 'session', type: 'hash', ttl: 600, size: 1920, lastAccess: '2026-07-28T10:25:00Z', encoding: 'ziplist', value: { userId: '1005', ip: '172.16.0.22', ua: 'Safari/17', loginAt: '1690511500' } },
  // cache 命名空间
  { name: 'cache:home:page', namespace: 'cache', type: 'string', ttl: 300, size: 45600, lastAccess: '2026-07-28T10:33:00Z', encoding: 'raw', value: '<html>...首页HTML缓存内容...</html>' },
  { name: 'cache:product:list', namespace: 'cache', type: 'string', ttl: 600, size: 32800, lastAccess: '2026-07-28T10:30:00Z', encoding: 'raw', value: '[{"id":1,"name":"商品A"},{"id":2,"name":"商品B"}...]' },
  { name: 'cache:user:1001:avatar', namespace: 'cache', type: 'string', ttl: 86400, size: 102400, lastAccess: '2026-07-27T22:00:00Z', encoding: 'raw', value: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ...' },
  { name: 'cache:config:site', namespace: 'cache', type: 'hash', ttl: -1, size: 456, lastAccess: '2026-07-28T08:00:00Z', encoding: 'ziplist', value: { title: '示例站点', icp: '京ICP备12345678号', footer: 'Copyright 2026' } },
  // config 命名空间
  { name: 'config:app:settings', namespace: 'config', type: 'hash', ttl: -1, size: 890, lastAccess: '2026-07-28T06:00:00Z', encoding: 'ziplist', value: { maxUpload: '10485760', debug: 'false', maintenance: 'false', version: '3.2.1' } },
  { name: 'config:feature:flags', namespace: 'config', type: 'hash', ttl: -1, size: 320, lastAccess: '2026-07-28T06:00:00Z', encoding: 'ziplist', value: { newCheckout: 'true', darkMode: 'true', betaApi: 'false' } },
  { name: 'config:rate:limit', namespace: 'config', type: 'string', ttl: -1, size: 64, lastAccess: '2026-07-27T12:00:00Z', encoding: 'raw', value: '{"window":60,"max":100}' },
  // queue 命名空间
  { name: 'queue:email:pending', namespace: 'queue', type: 'list', ttl: -1, size: 3200, lastAccess: '2026-07-28T10:32:00Z', encoding: 'quicklist', value: ['job:email:001', 'job:email:002', 'job:email:003', 'job:email:004', 'job:email:005'] },
  { name: 'queue:sms:pending', namespace: 'queue', type: 'list', ttl: -1, size: 1600, lastAccess: '2026-07-28T10:20:00Z', encoding: 'quicklist', value: ['job:sms:101', 'job:sms:102', 'job:sms:103'] },
  { name: 'queue:notification:failed', namespace: 'queue', type: 'list', ttl: 86400, size: 800, lastAccess: '2026-07-28T09:00:00Z', encoding: 'quicklist', value: ['job:notif:f01', 'job:notif:f02'] },
  // rank 命名空间
  { name: 'rank:leaderboard', namespace: 'rank', type: 'zset', ttl: -1, size: 4800, lastAccess: '2026-07-28T10:33:00Z', encoding: 'skiplist', value: [['player:A', 9850], ['player:B', 9320], ['player:C', 8710], ['player:D', 8200], ['player:E', 7650]] },
  { name: 'rank:weekly:sales', namespace: 'rank', type: 'zset', ttl: 604800, size: 2400, lastAccess: '2026-07-28T00:00:00Z', encoding: 'skiplist', value: [['seller:001', 158000], ['seller:002', 132000], ['seller:003', 98000]] },
  // lock 命名空间
  { name: 'lock:order:5001', namespace: 'lock', type: 'string', ttl: 30, size: 16, lastAccess: '2026-07-28T10:33:10Z', encoding: 'raw', value: 'node-3:pid:8821' },
  { name: 'lock:payment:8002', namespace: 'lock', type: 'string', ttl: 15, size: 16, lastAccess: '2026-07-28T10:33:05Z', encoding: 'raw', value: 'node-1:pid:4455' },
  // stats 命名空间
  { name: 'stats:daily:visits', namespace: 'stats', type: 'string', ttl: 86400, size: 128, lastAccess: '2026-07-28T10:00:00Z', encoding: 'raw', value: '{"date":"2026-07-28","count":48523}' },
  { name: 'stats:api:calls', namespace: 'stats', type: 'hash', ttl: 3600, size: 640, lastAccess: '2026-07-28T10:30:00Z', encoding: 'ziplist', value: { GET: '32451', POST: '8120', PUT: '2340', DELETE: '890' } },
  { name: 'stats:error:count', namespace: 'stats', type: 'string', ttl: 3600, size: 32, lastAccess: '2026-07-28T10:33:00Z', encoding: 'raw', value: '312' },
  // geo 命名空间
  { name: 'geo:drivers:online', namespace: 'geo', type: 'zset', ttl: 300, size: 6400, lastAccess: '2026-07-28T10:32:00Z', encoding: 'skiplist', value: [['driver:101', 116.4], ['driver:102', 121.5], ['driver:103', 113.3]] },
  // tag 命名空间
  { name: 'tag:article:hot', namespace: 'tag', type: 'set', ttl: 1800, size: 256, lastAccess: '2026-07-28T10:15:00Z', encoding: 'hashtable', value: ['article:2001', 'article:2005', 'article:2010', 'article:2015'] },
  { name: 'tag:product:featured', namespace: 'tag', type: 'set', ttl: -1, size: 192, lastAccess: '2026-07-27T18:00:00Z', encoding: 'hashtable', value: ['prod:301', 'prod:302', 'prod:305'] },
  // temp 命名空间
  { name: 'temp:captcha:1001', namespace: 'temp', type: 'string', ttl: 120, size: 8, lastAccess: '2026-07-28T10:33:00Z', encoding: 'raw', value: 'A7x9Kp' },
  { name: 'temp:verify:phone:13800001111', namespace: 'temp', type: 'string', ttl: 300, size: 6, lastAccess: '2026-07-28T10:29:00Z', encoding: 'raw', value: '846291' },
];

/* ─── 工具函数 ─── */

/** 格式化文件大小 */
function formatSize(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

/** 格式化 TTL */
function formatTtl(ttl: number): string {
  if (ttl === -1) return '永久';
  if (ttl >= 86400) return `${Math.floor(ttl / 86400)}天${Math.floor((ttl % 86400) / 3600)}小时`;
  if (ttl >= 3600) return `${Math.floor(ttl / 3600)}小时${Math.floor((ttl % 3600) / 60)}分`;
  if (ttl >= 60) return `${Math.floor(ttl / 60)}分${ttl % 60}秒`;
  return `${ttl}秒`;
}

/** 格式化时间 */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 类型标签颜色映射 */
function getTypeBadgeClass(type: RedisKeyType): string {
  const map: Record<RedisKeyType, string> = {
    string: 'bg-green-100 text-green-800',
    hash: 'bg-blue-100 text-blue-800',
    list: 'bg-yellow-100 text-yellow-800',
    set: 'bg-purple-100 text-purple-800',
    zset: 'bg-pink-100 text-pink-800',
  };
  return map[type];
}

/* ─── 键详情弹窗组件 ─── */

interface KeyDetailModalProps {
  redisKey: RedisKey;
  onClose: () => void;
}

function KeyDetailModal({ redisKey, onClose }: KeyDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[520px] max-h-[80vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        {/* 标题栏 */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">键详情</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 基本信息 */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">键名</label>
            <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              <code>{redisKey.name}</code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">类型</label>
              <div className="mt-1">
                <span className={`rounded px-2 py-1 text-xs font-medium ${getTypeBadgeClass(redisKey.type)}`}>
                  {redisKey.type}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">编码</label>
              <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {redisKey.encoding}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">TTL</label>
              <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {formatTtl(redisKey.ttl)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">大小</label>
              <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                {formatSize(redisKey.size)}
              </div>
            </div>
          </div>

          {/* 值展示区 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">值</label>
            <div className="rounded border border-gray-200 bg-gray-50 p-3">
              {renderValue(redisKey)}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            className="flex items-center gap-1.5 rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={14} />
            刷新TTL
          </button>
          <button
            className="flex items-center gap-1.5 rounded border border-red-500 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            删除
          </button>
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

/** 根据类型渲染值 */
function renderValue(key: RedisKey) {
  switch (key.type) {
    case 'string': {
      const value = key.value as string;
      // 检测是否为 JSON
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          const formatted = JSON.stringify(parsed, null, 2);
          return (
            <pre className="whitespace-pre-wrap break-all text-xs font-mono">
              {highlightJSON(formatted)}
            </pre>
          );
        } catch {
          // 不是有效 JSON，继续检测 SQL
        }
      }
      // 检测是否为 SQL
      if (/^(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\s/i.test(value)) {
        return (
          <pre className="whitespace-pre-wrap break-all text-xs font-mono">
            {highlightSQL(value)}
          </pre>
        );
      }
      // 普通字符串
      return (
        <pre className="whitespace-pre-wrap break-all text-xs text-gray-700 font-mono">
          {value}
        </pre>
      );
    }
    case 'hash': {
      const entries = Object.entries(key.value as Record<string, string>);
      return (
        <div className="overflow-hidden rounded border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">字段</th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">值</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map(([field, val]) => (
                <tr key={field}>
                  <td className="px-3 py-1.5 text-xs font-mono text-gray-700">{field}</td>
                  <td className="px-3 py-1.5 text-xs font-mono text-gray-600 break-all">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    case 'list':
      return (
        <div className="space-y-1">
          {(key.value as string[]).map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-right text-gray-400 font-mono">{i}</span>
              <span className="rounded bg-gray-100 px-2 py-1 font-mono text-gray-700 break-all">{item}</span>
            </div>
          ))}
        </div>
      );
    case 'set':
      return (
        <div className="flex flex-wrap gap-2">
          {(key.value as string[]).map((item, i) => (
            <span key={i} className="rounded bg-purple-50 border border-purple-200 px-2 py-1 text-xs font-mono text-purple-700">
              {item}
            </span>
          ))}
        </div>
      );
    case 'zset':
      return (
        <div className="overflow-hidden rounded border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">成员</th>
                <th className="px-3 py-1.5 text-left text-xs font-semibold text-gray-600">分数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(key.value as [string, number][]).map(([member, score], i) => (
                <tr key={i}>
                  <td className="px-3 py-1.5 text-xs font-mono text-gray-700">{member}</td>
                  <td className="px-3 py-1.5 text-xs font-mono text-gray-600">{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    default:
      return null;
  }
}

/** Simple SQL syntax highlighting */
function highlightSQL(line: string): React.ReactNode {
  const keywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'FROM', 'WHERE', 'AND', 'OR', 'SET', 'VALUES', 'INTO', 'TABLE', 'NOT', 'NULL', 'AUTO_INCREMENT', 'DEFAULT', 'PRIMARY', 'KEY', 'ENGINE', 'CHARSET', 'COLLATE', 'ON', 'UPDATE', 'CURRENT_TIMESTAMP', 'VARCHAR', 'TEXT', 'INT', 'BIGINT', 'TIMESTAMP', 'DECIMAL', 'BOOLEAN', 'ENUM', 'JSON', 'TINYINT', 'MEDIUMTEXT', 'DATE', 'TIME', 'DATETIME', 'UNIQUE', 'INDEX', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];
  const parts = line.split(/(\s+|[()`,;])/);

  return parts.map((part, i) => {
    if (keywords.includes(part.toUpperCase())) {
      return <span key={i} className="text-purple-400 font-medium">{part}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <span key={i} className="text-green-400">{part}</span>;
    }
    if (/^'.*'$/.test(part)) {
      return <span key={i} className="text-amber-300">{part}</span>;
    }
    if (/^\d+$/.test(part)) {
      return <span key={i} className="text-orange-400">{part}</span>;
    }
    return <span key={i} className="text-gray-300">{part}</span>;
  });
}

/** Simple JSON syntax highlighting */
function highlightJSON(line: string): React.ReactNode {
  const parts = line.split(/("(?:[^"\\]|\\.)*")/g);

  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      // Check if it's a key (followed by colon)
      if (line.trim().startsWith(part + ':') || line.trim().startsWith(part + ' :')) {
        return <span key={i} className="text-blue-400">{part}</span>;
      }
      return <span key={i} className="text-green-400">{part}</span>;
    }
    // Numbers and booleans
    if (/^\d+$/.test(part.trim()) || /^\d+\.\d+$/.test(part.trim()) || part.trim() === 'true' || part.trim() === 'false' || part.trim() === 'null') {
      return <span key={i} className="text-orange-400">{part}</span>;
    }
    return <span key={i} className="text-gray-300">{part}</span>;
  });
}

/* ─── Redis 管理页面主组件 ─── */

/**
 * Redis 管理页面。
 * 功能：统计卡片、键列表（分页 + 搜索）、键详情弹窗。
 */
export function RedisPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<RedisKey | null>(null);

  const itemsPerPage = 10;

  // 根据搜索词过滤
  const filteredKeys = useMemo(() => {
    if (!searchQuery.trim()) return mockRedisKeys;
    const q = searchQuery.toLowerCase();
    return mockRedisKeys.filter((k) => k.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredKeys.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredKeys.length);
  const currentKeys = filteredKeys.slice(startIndex, endIndex);

  // 搜索变化时重置页码
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Redis</h1>
          <p className="mt-1 text-sm text-gray-500">键浏览、数据查看与缓存管理。</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      {/* ─── 统计卡片 ─── */}
      <div className="grid grid-cols-6 gap-4 border-b bg-white px-6 py-4">
        {redisStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded"
                  style={{ backgroundColor: stat.color + '20' }}
                >
                  <Icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {stat.value}
                    {stat.unit && <span className="ml-1 text-xs font-normal text-gray-500">{stat.unit}</span>}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── 键列表 ─── */}
      <div className="flex-1 overflow-auto bg-white px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">键列表</h3>
          {/* 搜索框 */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="按键名搜索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="rounded border border-gray-300 py-1.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">键名</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">命名空间/类型</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">TTL</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">大小</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">最后访问</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                    未找到匹配的键
                  </td>
                </tr>
              ) : (
                currentKeys.map((key, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-sm text-gray-900">
                      <code className="text-xs">{key.name}</code>
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">{key.namespace}</span>
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${getTypeBadgeClass(key.type)}`}>
                          {key.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{formatTtl(key.ttl)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{formatSize(key.size)}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{formatTime(key.lastAccess)}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setSelectedKey(key)}
                          className="flex items-center gap-1 rounded border border-blue-600 bg-white px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={12} />
                          查看
                        </button>
                        <button
                          className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <Copy size={12} />
                          复制
                        </button>
                        <button
                          className="flex items-center gap-1 rounded border border-red-500 bg-white px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={12} />
                          删除
                        </button>
                        <button
                          className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                          <RotateCcw size={12} />
                          TTL
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── 分页 ─── */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            共 {filteredKeys.length} 个键 · 当前第 {currentPage} 页 / 共 {totalPages} 页
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              上一页
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 键详情弹窗 ─── */}
      {selectedKey && <KeyDetailModal redisKey={selectedKey} onClose={() => setSelectedKey(null)} />}
    </div>
  );
}
