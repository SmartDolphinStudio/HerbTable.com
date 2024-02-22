import React, { useState } from 'react';
import { Search, Filter, Download, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  id: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  message: string;
}

const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => {
  const levels: LogLevel[] = ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR', 'DEBUG'];
  const sources = ['auth', 'api', 'db', 'cron', 'security', 'system'];
  const messages = [
    'User login successful', 'API request processed', 'Database query completed',
    'Scheduled task executed', 'Security scan completed', 'System health check passed',
    'Rate limit exceeded', 'Connection timeout', 'Invalid token detected',
    'Cache miss for key', 'Session expired', 'File upload completed',
  ];
  return {
    id: i,
    timestamp: `2026-07-28 ${String(12 - Math.floor(i / 4)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}`,
    level: levels[i % levels.length],
    source: sources[i % sources.length],
    message: messages[i % messages.length],
  };
});

export default function LogPage() {
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const filtered = mockLogs.filter(l =>
    (filter === 'ALL' || l.level === filter) &&
    (l.message.toLowerCase().includes(search.toLowerCase()) || l.source.toLowerCase().includes(search.toLowerCase()))
  );

  const levelIcon = (level: LogLevel) => {
    switch (level) {
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
      case 'DEBUG': return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const levelColor = (level: LogLevel) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-700';
      case 'WARN': return 'bg-yellow-100 text-yellow-700';
      case 'INFO': return 'bg-blue-100 text-blue-700';
      case 'DEBUG': return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">System Logs</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const).map(l => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filter === l ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl overflow-hidden font-mono text-sm">
        <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs flex justify-between">
          <span>{filtered.length} entries</span>
          <span>Live</span>
        </div>
        <div className="max-h-[600px] overflow-y-auto">
          {filtered.map(log => (
            <div key={log.id} className="px-4 py-2 border-b border-gray-800 hover:bg-gray-800/50 flex items-start gap-3">
              <span className="text-gray-500 text-xs whitespace-nowrap mt-0.5">{log.timestamp}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${levelColor(log.level)}`}>{log.level}</span>
              <span className="text-cyan-400 text-xs whitespace-nowrap">[{log.source}]</span>
              <span className="text-gray-300">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
