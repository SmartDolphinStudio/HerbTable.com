import { useState, useEffect, useRef } from 'react';
import { RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react';

/** Mock API statistics */
const apiStats = [
  { label: '采样请求', value: '12,847', color: '#3b82f6' },
  { label: '错误率', value: '2.35%', color: '#22c55e' },
  { label: 'P50', value: '45ms', color: '#8b5cf6' },
  { label: 'P95', value: '186ms', color: '#f59e0b' },
  { label: 'P99', value: '523ms', color: '#ec4899' },
];

/** Mock API endpoints - 25 endpoints covering various groups */
const apiEndpoints = [
  // 用户分组
  { method: 'GET', path: '/api/users', group: '用户', permission: 'Admin', status: '启用' },
  { method: 'GET', path: '/api/users/:id', group: '用户', permission: '登录', status: '启用' },
  { method: 'POST', path: '/api/users', group: '用户', permission: 'Admin', status: '启用' },
  { method: 'PUT', path: '/api/users/:id', group: '用户', permission: 'Admin', status: '启用' },
  { method: 'DELETE', path: '/api/users/:id', group: '用户', permission: 'Admin', status: '禁用' },
  
  // 订单分组
  { method: 'GET', path: '/api/orders', group: '订单', permission: '登录', status: '启用' },
  { method: 'GET', path: '/api/orders/:id', group: '订单', permission: '登录', status: '启用' },
  { method: 'POST', path: '/api/orders', group: '订单', permission: '登录', status: '启用' },
  { method: 'PUT', path: '/api/orders/:id/status', group: '订单', permission: 'Admin', status: '启用' },
  { method: 'DELETE', path: '/api/orders/:id', group: '订单', permission: 'Admin', status: '禁用' },
  
  // 支付分组
  { method: 'POST', path: '/api/payments/create', group: '支付', permission: '登录', status: '启用' },
  { method: 'GET', path: '/api/payments/:id', group: '支付', permission: '登录', status: '启用' },
  { method: 'POST', path: '/api/payments/refund', group: '支付', permission: 'Admin', status: '启用' },
  { method: 'GET', path: '/api/payments/history', group: '支付', permission: '登录', status: '启用' },
  
  // 商品分组
  { method: 'GET', path: '/api/products', group: '商品', permission: '公开', status: '启用' },
  { method: 'GET', path: '/api/products/:id', group: '商品', permission: '公开', status: '启用' },
  { method: 'POST', path: '/api/products', group: '商品', permission: 'Admin', status: '启用' },
  { method: 'PUT', path: '/api/products/:id', group: '商品', permission: 'Admin', status: '启用' },
  { method: 'DELETE', path: '/api/products/:id', group: '商品', permission: 'Admin', status: '禁用' },
  { method: 'GET', path: '/api/products/categories', group: '商品', permission: '公开', status: '启用' },
  
  // 认证分组
  { method: 'POST', path: '/api/auth/login', group: '认证', permission: '公开', status: '启用' },
  { method: 'POST', path: '/api/auth/register', group: '认证', permission: '公开', status: '启用' },
  { method: 'POST', path: '/api/auth/logout', group: '认证', permission: '登录', status: '启用' },
  { method: 'GET', path: '/api/auth/profile', group: '认证', permission: '登录', status: '启用' },
  { method: 'POST', path: '/api/auth/refresh', group: '认证', permission: '登录', status: '启用' },
];

/** Generate mock API log entries */
function generateLogEntries(count: number): string[] {
  const methods = ['GET', 'POST', 'PUT', 'DELETE'];
  const paths = apiEndpoints.map(e => e.path);
  const statuses = [200, 201, 400, 401, 403, 404, 500];
  const entries: string[] = [];

  for (let i = 0; i < count; i++) {
    const method = methods[Math.floor(Math.random() * methods.length)];
    const path = paths[Math.floor(Math.random() * paths.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const duration = Math.floor(Math.random() * 500) + 10;
    const timestamp = new Date(Date.now() - i * 1000 * 60).toISOString();
    entries.push(`[${timestamp}] ${method} ${path} ${status} ${duration}ms`);
  }

  return entries;
}

/**
 * API Management page.
 * Features: statistics cards, endpoint table with pagination, scrolling log viewer, per-API management modal.
 */
export function APIPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApi, setSelectedApi] = useState<typeof apiEndpoints[0] | null>(null);
  const [logEntries, setLogEntries] = useState<string[]>(() => generateLogEntries(100));
  const logContainerRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 9;
  const totalPages = Math.ceil(apiEndpoints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, apiEndpoints.length);
  const currentEndpoints = apiEndpoints.slice(startIndex, endIndex);

  // Simulate live log updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLogEntries((prev) => {
        const newEntry = generateLogEntries(1)[0];
        return [newEntry, ...prev.slice(0, 99)];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll log to top
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logEntries]);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleManageApi = (api: typeof apiEndpoints[0]) => {
    setSelectedApi(api);
  };

  const handleCloseModal = () => {
    setSelectedApi(null);
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">API 管理</h1>
          <p className="mt-1 text-sm text-gray-500">接口目录、状态码和真实延迟分位数。</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            <RefreshCw size={16} />
            刷新
          </button>
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid grid-cols-5 gap-4 border-b bg-white px-6 py-4">
        {apiStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-1 text-lg font-bold" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* API Endpoints Table */}
      <div className="border-b bg-white px-6 py-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">API 接口列表</h3>
        <div className="overflow-hidden rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">方法</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">路径</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">分组</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">权限</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentEndpoints.map((endpoint, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 text-sm">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        endpoint.method === 'GET'
                          ? 'bg-green-100 text-green-800'
                          : endpoint.method === 'POST'
                          ? 'bg-blue-100 text-blue-800'
                          : endpoint.method === 'PUT'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {endpoint.method}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-900">
                    <code className="text-xs">{endpoint.path}</code>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{endpoint.group}</td>
                  <td className="px-4 py-2.5 text-sm text-gray-600">{endpoint.permission}</td>
                  <td className="px-4 py-2.5 text-sm">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                      endpoint.status === '启用'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {endpoint.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm">
                    <button
                      onClick={() => handleManageApi(endpoint)}
                      className="rounded border border-blue-600 bg-white px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      管理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination controls */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            当前第 {currentPage} 页 / 共 {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              上一页
            </button>
            {/* 页码输入框：支持直接输入页码跳转 */}
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (!isNaN(page) && page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              onBlur={(e) => {
                const page = parseInt(e.target.value);
                if (isNaN(page) || page < 1) setCurrentPage(1);
                else if (page > totalPages) setCurrentPage(totalPages);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value);
                  if (isNaN(page) || page < 1) setCurrentPage(1);
                  else if (page > totalPages) setCurrentPage(totalPages);
                }
              }}
              className="w-16 rounded border border-gray-300 px-2 py-1.5 text-center text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">/ {totalPages} 页</span>
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

      {/* API Logs - Fixed at bottom */}
      <div className="bg-white px-6 py-4">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">API 服务原始日志（最近 100 行）</h3>
        <div
          ref={logContainerRef}
          className="h-[400px] overflow-y-auto rounded-lg border bg-[#1e1e2e] p-4 font-mono text-xs text-gray-300"
        >
          {logEntries.map((entry, index) => (
            <div key={index} className="py-0.5">
              {entry}
            </div>
          ))}
        </div>
      </div>

      {/* Per-API Management Modal */}
      {selectedApi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">API 管理</h3>
              <button
                onClick={handleCloseModal}
                className="rounded p-1 hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">API 路径</label>
                <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  <code>{selectedApi.path}</code>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">原始服务选择</label>
                <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option>主服务 (http://localhost:3000)</option>
                  <option>备用服务 (http://localhost:3001)</option>
                  <option>测试服务 (http://localhost:3002)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">日志级别</label>
                <select className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm">
                  <option>INFO</option>
                  <option>WARN</option>
                  <option>ERROR</option>
                  <option>DEBUG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">采样率</label>
                <input
                  type="number"
                  defaultValue={100}
                  min={1}
                  max={100}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">启用状态</label>
                <div className="mt-1 flex items-center gap-2">
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked={selectedApi.status === '启用'} className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300"></div>
                  </label>
                  <span className="text-sm text-gray-600">{selectedApi.status === '启用' ? '已启用' : '已禁用'}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={handleCloseModal}
                  className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCloseModal}
                  className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
