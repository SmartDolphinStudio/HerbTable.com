/**
 * 计划任务管理页面
 * 功能：管理和调度各种脚本任务（Shell、Python、数据库备份等）
 * 设计：工业级代码风格，组件化设计，Tailwind CSS样式
 */

import React, { useState } from 'react';

// ==================== 类型定义 ====================

/** 任务类型枚举 */
type TaskType = 
  | 'shell'
  | 'python'
  | 'lua'
  | 'ruby'
  | 'bash'
  | 'php'
  | 'nodejs'
  | 'website_backup'
  | 'database_backup'
  | 'website_split'
  | 'malware_scan';

/** 周期类型枚举 */
type PeriodType = 'daily' | 'weekly' | 'monthly' | 'hourly' | 'minutely' | 'custom';

/** 任务状态枚举 */
type TaskStatus = 'running' | 'paused';

/** 任务数据接口 */
interface CronTask {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  period: string;
  lastRun: string;
  nextRun: string;
  processLock: boolean;
  user: string;
  script: string;
}

/** 任务类型配置映射 */
const TASK_TYPE_MAP: Record<TaskType, string> = {
  shell: 'Shell脚本',
  python: 'Python脚本',
  lua: 'Lua脚本',
  ruby: 'Ruby脚本',
  bash: 'Bash脚本',
  php: 'PHP脚本',
  nodejs: 'Node.js脚本',
  website_backup: '网站备份',
  database_backup: '数据库增量备份',
  website_split: '网站切割',
  malware_scan: '木马查杀'
};

/** 执行用户列表 */
const USER_LIST = ['root', 'www', 'nginx', 'mysql', 'nobody', 'u1', 'u2', 'uuid'];

// ==================== 模拟数据 ====================

/** 初始任务数据 */
const MOCK_TASKS: CronTask[] = [
  {
    id: '1',
    name: '每日数据库备份',
    type: 'database_backup',
    status: 'running',
    period: '每天 02:00',
    lastRun: '2026-07-28 02:00:15',
    nextRun: '2026-07-29 02:00:00',
    processLock: true,
    user: 'root',
    script: '#!/bin/bash\nmysqldump -u root -p*** all_databases > /backup/db_$(date +%Y%m%d).sql'
  },
  {
    id: '2',
    name: '每小时日志清理',
    type: 'shell',
    status: 'running',
    period: '每小时',
    lastRun: '2026-07-28 14:00:05',
    nextRun: '2026-07-28 15:00:00',
    processLock: false,
    user: 'www',
    script: '#!/bin/bash\nfind /var/log -name "*.log" -mtime +7 -delete'
  },
  {
    id: '3',
    name: '每周安全扫描',
    type: 'malware_scan',
    status: 'running',
    period: '每周一 03:30',
    lastRun: '2026-07-27 03:30:22',
    nextRun: '2026-08-03 03:30:00',
    processLock: true,
    user: 'root',
    script: '#!/bin/bash\nclamscan -r /var/www --log=/var/log/clamav/scan.log'
  },
  {
    id: '4',
    name: '网站备份任务',
    type: 'website_backup',
    status: 'running',
    period: '每天 04:00',
    lastRun: '2026-07-28 04:00:10',
    nextRun: '2026-07-29 04:00:00',
    processLock: true,
    user: 'root',
    script: '#!/bin/bash\ntar -czf /backup/www_$(date +%Y%m%d).tar.gz /var/www/html'
  },
  {
    id: '5',
    name: 'Python数据分析',
    type: 'python',
    status: 'paused',
    period: '每月1日 05:00',
    lastRun: '2026-07-01 05:00:33',
    nextRun: '2026-08-01 05:00:00',
    processLock: false,
    user: 'www',
    script: '#!/usr/bin/env python3\nimport pandas as pd\n# 数据分析脚本...'
  },
  {
    id: '6',
    name: '日志轮转脚本',
    type: 'bash',
    status: 'running',
    period: '每天 00:00',
    lastRun: '2026-07-28 00:00:08',
    nextRun: '2026-07-29 00:00:00',
    processLock: false,
    user: 'root',
    script: '#!/bin/bash\nlogrotate /etc/logrotate.conf'
  },
  {
    id: '7',
    name: 'Node.js定时任务',
    type: 'nodejs',
    status: 'running',
    period: '每30分钟',
    lastRun: '2026-07-28 14:30:12',
    nextRun: '2026-07-28 15:00:00',
    processLock: true,
    user: 'www',
    script: 'const fs = require("fs");\n// Node.js定时任务逻辑...'
  },
  {
    id: '8',
    name: 'PHP缓存清理',
    type: 'php',
    status: 'running',
    period: '每小时',
    lastRun: '2026-07-28 14:00:18',
    nextRun: '2026-07-28 15:00:00',
    processLock: false,
    user: 'www',
    script: '<?php\n// 清理PHP缓存\narray_map("unlink", glob("/tmp/cache/*"));\n?>'
  },
  {
    id: '9',
    name: 'Lua配置同步',
    type: 'lua',
    status: 'paused',
    period: '每周五 06:00',
    lastRun: '2026-07-25 06:00:25',
    nextRun: '2026-08-01 06:00:00',
    processLock: false,
    user: 'nginx',
    script: '#!/usr/bin/lua\n-- Lua配置同步脚本\nprint("Syncing config...")'
  },
  {
    id: '10',
    name: 'Ruby报告生成',
    type: 'ruby',
    status: 'running',
    period: '每天 07:00',
    lastRun: '2026-07-28 07:00:14',
    nextRun: '2026-07-29 07:00:00',
    processLock: true,
    user: 'www',
    script: '#!/usr/bin/env ruby\n# Ruby报告生成脚本\nputs "Generating report..."'
  },
  {
    id: '11',
    name: '网站静态资源切割',
    type: 'website_split',
    status: 'paused',
    period: '每月15日 03:00',
    lastRun: '2026-07-15 03:00:40',
    nextRun: '2026-08-15 03:00:00',
    processLock: false,
    user: 'root',
    script: '#!/bin/bash\n# 网站静态资源切割脚本\nfind /var/www/static -type f -name "*.jpg" -size +1M -exec convert {} -resize 50% {} \\;'
  },
  {
    id: '12',
    name: '自定义监控脚本',
    type: 'shell',
    status: 'running',
    period: '每5分钟',
    lastRun: '2026-07-28 14:55:03',
    nextRun: '2026-07-28 15:00:00',
    processLock: true,
    user: 'root',
    script: '#!/bin/bash\n# 系统监控脚本\nfree -m | awk \'NR==2{printf "Memory Usage: %.2f%%\\n", $3*100/$2 }\''
  }
];

// ==================== 子组件 ====================

/** 统计卡片组件 */
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
    <div className={`${color} p-3 rounded-full`}>
      {icon}
    </div>
  </div>
);

/** 任务类型选择器组件 */
const TaskTypeSelector: React.FC<{
  value: TaskType;
  onChange: (type: TaskType) => void;
}> = ({ value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      任务类型 <span className="text-red-500">*</span>
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TaskType)}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {Object.entries(TASK_TYPE_MAP).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  </div>
);

/** 每日配置 */
function DailyConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">小时</label>
        <input
          type="number"
          min="0"
          max="23"
          value={config.hour || 0}
          onChange={(e) => onConfigChange({ ...config, hour: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">分钟</label>
        <input
          type="number"
          min="0"
          max="59"
          value={config.minute || 0}
          onChange={(e) => onConfigChange({ ...config, minute: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

/** 每周配置 */
function WeeklyConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">星期几</label>
        <select
          value={config.dayOfWeek || 1}
          onChange={(e) => onConfigChange({ ...config, dayOfWeek: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={1}>星期一</option>
          <option value={2}>星期二</option>
          <option value={3}>星期三</option>
          <option value={4}>星期四</option>
          <option value={5}>星期五</option>
          <option value={6}>星期六</option>
          <option value={0}>星期日</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">小时</label>
          <input
            type="number"
            min="0"
            max="23"
            value={config.hour || 0}
            onChange={(e) => onConfigChange({ ...config, hour: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分钟</label>
          <input
            type="number"
            min="0"
            max="59"
            value={config.minute || 0}
            onChange={(e) => onConfigChange({ ...config, minute: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

/** 每月配置 */
function MonthlyConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">日期</label>
        <input
          type="number"
          min="1"
          max="31"
          value={config.day || 1}
          onChange={(e) => onConfigChange({ ...config, day: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">小时</label>
          <input
            type="number"
            min="0"
            max="23"
            value={config.hour || 0}
            onChange={(e) => onConfigChange({ ...config, hour: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">分钟</label>
          <input
            type="number"
            min="0"
            max="59"
            value={config.minute || 0}
            onChange={(e) => onConfigChange({ ...config, minute: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

/** 每小时配置 */
function HourlyConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">间隔（小时）</label>
      <input
        type="number"
        min="1"
        max="23"
        value={config.interval || 1}
        onChange={(e) => onConfigChange({ ...config, interval: parseInt(e.target.value) })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/** 每分钟配置 */
function MinutelyConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">间隔（分钟）</label>
      <input
        type="number"
        min="1"
        max="59"
        value={config.interval || 1}
        onChange={(e) => onConfigChange({ ...config, interval: parseInt(e.target.value) })}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/** 自定义 Cron 配置 */
function CustomConfig({ config, onConfigChange }: { config: any; onConfigChange: (c: any) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Cron 表达式</label>
      <input
        type="text"
        value={config.cron || '0 0 * * *'}
        onChange={(e) => onConfigChange({ ...config, cron: e.target.value })}
        placeholder="例如: 0 2 * * * (每天 2 点)"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
      />
      <p className="text-xs text-gray-500 mt-1">
        格式: 分 时 日 月 星期 (例: 0 2 * * * 表示每天 2 点)
      </p>
    </div>
  );
}

/** 周期配置组件映射表 */
const PERIOD_CONFIG_COMPONENTS: Record<PeriodType, React.FC<{ config: any; onConfigChange: (c: any) => void }>> = {
  daily: DailyConfig,
  weekly: WeeklyConfig,
  monthly: MonthlyConfig,
  hourly: HourlyConfig,
  minutely: MinutelyConfig,
  custom: CustomConfig,
};

/** 执行周期配置组件 */
const PeriodConfig: React.FC<{
  periodType: PeriodType;
  onPeriodTypeChange: (type: PeriodType) => void;
  config: any;
  onConfigChange: (config: any) => void;
}> = ({ periodType, onPeriodTypeChange, config, onConfigChange }) => {
  const ConfigComponent = PERIOD_CONFIG_COMPONENTS[periodType];

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          周期类型 <span className="text-red-500">*</span>
        </label>
        <select
          value={periodType}
          onChange={(e) => onPeriodTypeChange(e.target.value as PeriodType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="hourly">每小时</option>
          <option value="minutely">每分钟</option>
          <option value="custom">自定义 Cron 表达式</option>
        </select>
      </div>
      {ConfigComponent && <ConfigComponent config={config} onConfigChange={onConfigChange} />}
    </div>
  );
};

/** 任务表单弹窗组件 */
const TaskModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<CronTask>) => void;
  task?: CronTask | null;
}> = ({ isOpen, onClose, onSave, task }) => {
  // 表单状态
  const [taskType, setTaskType] = useState<TaskType>(task?.type || 'shell');
  const [taskName, setTaskName] = useState(task?.name || '');
  const [periodType, setPeriodType] = useState<PeriodType>('daily');
  const [periodConfig, setPeriodConfig] = useState<any>({ hour: 2, minute: 0 });
  const [processLock, setProcessLock] = useState(task?.processLock ?? true);
  const [user, setUser] = useState(task?.user || 'root');
  const [script, setScript] = useState(task?.script || '');

  /** 处理保存 */
  const handleSave = () => {
    if (!taskName.trim()) {
      alert('请输入任务名称');
      return;
    }
    if (!script.trim()) {
      alert('请输入脚本内容');
      return;
    }

    // 生成周期描述
    let periodDesc = '';
    switch (periodType) {
      case 'daily':
        periodDesc = `每天 ${String(periodConfig.hour).padStart(2, '0')}:${String(periodConfig.minute).padStart(2, '0')}`;
        break;
      case 'weekly':
        const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
        periodDesc = `每周${weekDays[periodConfig.dayOfWeek]} ${String(periodConfig.hour).padStart(2, '0')}:${String(periodConfig.minute).padStart(2, '0')}`;
        break;
      case 'monthly':
        periodDesc = `每月${periodConfig.day}日 ${String(periodConfig.hour).padStart(2, '0')}:${String(periodConfig.minute).padStart(2, '0')}`;
        break;
      case 'hourly':
        periodDesc = `每${periodConfig.interval}小时`;
        break;
      case 'minutely':
        periodDesc = `每${periodConfig.interval}分钟`;
        break;
      case 'custom':
        periodDesc = `自定义: ${periodConfig.cron}`;
        break;
    }

    onSave({
      id: task?.id || Date.now().toString(),
      name: taskName,
      type: taskType,
      status: task?.status || 'running',
      period: periodDesc,
      lastRun: task?.lastRun || '从未执行',
      nextRun: '即将计算',
      processLock,
      user,
      script
    });
  };

  /** 处理文件选择（模拟） */
  const handleFileSelect = () => {
    alert('文件选择器已打开（模拟功能）');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 弹窗头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {task ? '编辑任务' : '添加任务'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 弹窗内容 */}
        <div className="px-6 py-4 space-y-6">
          {/* 任务类型 */}
          <TaskTypeSelector value={taskType} onChange={setTaskType} />

          {/* 任务名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="请输入任务名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 执行周期 */}
          <PeriodConfig
            periodType={periodType}
            onPeriodTypeChange={setPeriodType}
            config={periodConfig}
            onConfigChange={setPeriodConfig}
          />

          {/* 进程锁 */}
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">进程锁</label>
              <p className="text-xs text-gray-500 mt-1">启用后，任务执行期间不会重复启动</p>
            </div>
            <button
              type="button"
              onClick={() => setProcessLock(!processLock)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                processLock ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  processLock ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 执行用户 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">执行用户</label>
            <select
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {USER_LIST.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 脚本内容 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              脚本内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="请输入脚本内容..."
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">文件大小限制：最大 10MB</p>
              <button
                type="button"
                onClick={handleFileSelect}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                选择脚本文件
              </button>
            </div>
          </div>
        </div>

        {/* 弹窗底部 */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== 主页面组件 ====================

const CronPage: React.FC = () => {
  // 状态管理
  const [tasks, setTasks] = useState<CronTask[]>(MOCK_TASKS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<CronTask | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  /** 计算统计数据 */
  const stats = {
    total: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    paused: tasks.filter(t => t.status === 'paused').length,
    todayExecuted: 23 // 模拟数据
  };

  /** 分页计算 */
  const totalPages = Math.ceil(tasks.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTasks = tasks.slice(startIndex, endIndex);

  /** 打开添加弹窗 */
  const handleAdd = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  /** 打开编辑弹窗 */
  const handleEdit = (task: CronTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  /** 删除任务 */
  const handleDelete = (taskId: string) => {
    if (window.confirm('确定要删除此任务吗？')) {
      setTasks(tasks.filter(t => t.id !== taskId));
    }
  };

  /** 立即执行任务 */
  const handleExecute = (taskId: string) => {
    if (window.confirm('确定要立即执行此任务吗？')) {
      alert('任务已提交执行（模拟功能）');
    }
  };

  /** 保存任务 */
  const handleSaveTask = (taskData: Partial<CronTask>) => {
    if (editingTask) {
      // 编辑模式
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, ...taskData } as CronTask : t));
    } else {
      // 添加模式
      setTasks([...tasks, taskData as CronTask]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">计划任务</h1>
              <p className="mt-1 text-sm text-gray-500">
                管理和调度各种脚本任务，支持Shell、Python、数据库备份等多种类型
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>添加任务</span>
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="总任务数"
            value={stats.total}
            color="bg-blue-100 text-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
          />
          <StatCard
            title="运行中"
            value={stats.running}
            color="bg-green-100 text-green-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="已暂停"
            value={stats.paused}
            color="bg-yellow-100 text-yellow-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="今日执行"
            value={stats.todayExecuted}
            color="bg-purple-100 text-purple-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* 任务列表表格 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务分类
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    任务状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    执行周期
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    上次执行
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    下次执行
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{task.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{TASK_TYPE_MAP[task.type]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          task.status === 'running'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {task.status === 'running' ? '运行中' : '已暂停'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{task.period}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{task.lastRun}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{task.nextRun}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="编辑"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="删除"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExecute(task.id)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="立即执行"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              显示 {startIndex + 1} - {Math.min(endIndex, tasks.length)} 条，共 {tasks.length} 条
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
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
                className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                / {totalPages} 页
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 任务弹窗 */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
      />
    </div>
  );
};

export default CronPage;
