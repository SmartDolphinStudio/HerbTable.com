/**
 * 系统设置页面
 * 包含系统主题和备份管理两个模块
 * 系统主题设置会实时生效（通过 ThemeContext）
 */

import { useState, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

// ============================================
// 类型定义
// ============================================

/** 备份记录类型 */
interface BackupRecord {
  id: string;
  name: string;
  type: '数据库' | '全站' | '文件' | '配置';
  size: string;
  createdAt: string;
  status: '成功' | '进行中' | '失败';
}

/** 创建备份表单数据 */
interface BackupFormData {
  name: string;
  storageLocation: '本机' | '服务器';
  backupTypes: string[];
  executionTime: '立即执行' | '定时执行';
  scheduledTime: string;
}

// ============================================
// 常量定义
// ============================================

/** 预设主题颜色 */
const PRESET_COLORS = [
  { name: '蓝色', value: '#3B82F6' },
  { name: '绿色', value: '#10B981' },
  { name: '红色', value: '#EF4444' },
  { name: '紫色', value: '#8B5CF6' },
  { name: '橙色', value: '#F59E0B' },
  { name: '青色', value: '#06B6D4' },
  { name: '粉色', value: '#EC4899' },
  { name: '黄色', value: '#EAB308' },
  { name: '灰色', value: '#6B7280' },
  { name: '棕色', value: '#92400E' },
  { name: '靛蓝', value: '#6366F1' },
  { name: '深灰', value: '#374151' },
];

/** 模拟备份数据 */
const MOCK_BACKUPS: BackupRecord[] = [
  { id: '1', name: 'daily_backup_20260728', type: '数据库', size: '245 MB', createdAt: '2026-07-28 08:00:00', status: '成功' },
  { id: '2', name: 'weekly_full_backup', type: '全站', size: '4.8 GB', createdAt: '2026-07-27 02:00:00', status: '成功' },
  { id: '3', name: 'config_backup_20260726', type: '文件', size: '12 MB', createdAt: '2026-07-26 15:30:00', status: '成功' },
  { id: '4', name: 'hourly_db_backup', type: '数据库', size: '89 MB', createdAt: '2026-07-28 09:00:00', status: '进行中' },
  { id: '5', name: 'monthly_archive_202606', type: '全站', size: '5.2 GB', createdAt: '2026-06-30 23:59:00', status: '成功' },
  { id: '6', name: 'failed_backup_20260725', type: '数据库', size: '0 MB', createdAt: '2026-07-25 10:00:00', status: '失败' },
  { id: '7', name: 'media_files_backup', type: '文件', size: '1.5 GB', createdAt: '2026-07-24 14:20:00', status: '成功' },
  { id: '8', name: 'test_environment_backup', type: '全站', size: '320 MB', createdAt: '2026-07-23 16:45:00', status: '成功' },
];

// ============================================
// 子组件
// ============================================

/** 颜色选择器组件 */
function ColorPicker({
  colors,
  selectedColor,
  onSelect,
}: {
  colors: typeof PRESET_COLORS;
  selectedColor: string;
  onSelect: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onSelect(color.value)}
          className={`w-10 h-10 rounded-lg transition-all ${
            selectedColor === color.value
              ? 'ring-2 ring-offset-2 ring-gray-900 scale-110'
              : 'hover:scale-105'
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        />
      ))}
    </div>
  );
}

/** 滑块组件 */
function Slider({
  label,
  value,
  min,
  max,
  unit = '',
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="text-sm text-gray-500">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

/** 创建备份弹窗组件 */
function CreateBackupModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BackupFormData) => void;
}) {
  const [formData, setFormData] = useState<BackupFormData>({
    name: '',
    storageLocation: '本机',
    backupTypes: [],
    executionTime: '立即执行',
    scheduledTime: '',
  });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const handleBackupTypeToggle = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      backupTypes: prev.backupTypes.includes(type)
        ? prev.backupTypes.filter((t) => t !== type)
        : [...prev.backupTypes, type],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6">
        <h3 className="text-xl font-bold text-gray-900">创建备份</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">备份名称</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="请输入备份名称"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">储存位置</label>
          <div className="flex gap-4">
            {['本机', '服务器'].map((location) => (
              <label key={location} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="storageLocation"
                  checked={formData.storageLocation === location}
                  onChange={() => setFormData({ ...formData, storageLocation: location as '本机' | '服务器' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{location}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">备份类型</label>
          <div className="flex flex-wrap gap-3">
            {['数据库', '全站', '文件', '配置'].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.backupTypes.includes(type)}
                  onChange={() => handleBackupTypeToggle(type)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">执行时间</label>
          <div className="flex gap-4">
            {['立即执行', '定时执行'].map((time) => (
              <label key={time} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="executionTime"
                  checked={formData.executionTime === time}
                  onChange={() => setFormData({ ...formData, executionTime: time as '立即执行' | '定时执行' })}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm text-gray-700">{time}</span>
              </label>
            ))}
          </div>
        </div>

        {formData.executionTime === '定时执行' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">执行时间</label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// 主组件
// ============================================

export default function SettingsPage() {
  const { theme, setTheme, resetTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<'系统主题' | '备份管理'>('系统主题');
  const [backups] = useState<BackupRecord[]>(MOCK_BACKUPS);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateBackupModalOpen, setIsCreateBackupModalOpen] = useState(false);
  const bgImageInputRef = useRef<HTMLInputElement>(null);

  // 分页计算
  const itemsPerPage = 10;
  const totalPages = Math.ceil(backups.length / itemsPerPage);
  const paginatedBackups = backups.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateBackup = (data: BackupFormData) => {
    console.log('创建备份:', data);
    alert(`备份 "${data.name}" 已创建`);
  };

  const handleDownloadBackup = (backup: BackupRecord) => {
    console.log('下载备份:', backup);
    alert(`正在下载: ${backup.name}`);
  };

  const handleDeleteBackup = (backup: BackupRecord) => {
    if (confirm(`确定要删除备份 "${backup.name}" 吗？`)) {
      console.log('删除备份:', backup);
      alert(`已删除: ${backup.name}`);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '成功': return 'bg-green-100 text-green-800';
      case '进行中': return 'bg-blue-100 text-blue-800';
      case '失败': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case '系统主题':
        return (
          <div className="space-y-8">
            {/* 主题色选择 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">主题色</label>
              <ColorPicker
                colors={PRESET_COLORS}
                selectedColor={theme.primaryColor}
                onSelect={(color) => setTheme({ primaryColor: color })}
              />
              <button
                onClick={resetTheme}
                className="mt-2 px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                恢复默认
              </button>
            </div>

            {/* 字体大小 */}
            <Slider
              label="字体大小"
              value={theme.fontSize}
              min={12}
              max={24}
              unit="px"
              onChange={(value) => setTheme({ fontSize: value })}
            />

            {/* 背景图片 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">背景图片</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                {theme.backgroundImage ? (
                  <div className="relative">
                    <img
                      src={theme.backgroundImage}
                      alt="背景预览"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      onClick={() => setTheme({ backgroundImage: '' })}
                      className="absolute top-2 right-2 px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600"
                    >
                      移除
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-500">点击或拖拽上传图片（推荐 PNG 格式）</p>
                    <button
                      onClick={() => bgImageInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      选择图片
                    </button>
                    <input
                      ref={bgImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setTheme({ backgroundImage: event.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 背景透明度 */}
            <Slider
              label="背景透明度"
              value={theme.backgroundOpacity}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => setTheme({ backgroundOpacity: value })}
            />

            {/* 侧边栏颜色 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">侧边栏颜色</label>
              <ColorPicker
                colors={PRESET_COLORS}
                selectedColor={theme.sidebarColor}
                onSelect={(color) => setTheme({ sidebarColor: color })}
              />
            </div>

            {/* 侧边栏透明度 */}
            <Slider
              label="侧边栏透明度"
              value={theme.sidebarOpacity}
              min={0}
              max={100}
              unit="%"
              onChange={(value) => setTheme({ sidebarOpacity: value })}
            />

            {/* 预览区域 */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">效果预览</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden h-64 flex">
                <div
                  className="w-48 p-4 space-y-3"
                  style={{
                    backgroundColor: theme.sidebarColor,
                    opacity: theme.sidebarOpacity / 100,
                  }}
                >
                  <div className="text-white font-bold text-lg">系统名称</div>
                  <div className="space-y-2">
                    <div className="text-white/80 text-sm">菜单项 1</div>
                    <div className="text-white/80 text-sm">菜单项 2</div>
                    <div className="text-white/80 text-sm">菜单项 3</div>
                  </div>
                </div>
                <div
                  className="flex-1 p-6"
                  style={{
                    backgroundColor: `rgba(255, 255, 255, ${theme.backgroundOpacity / 100})`,
                    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div
                    className="text-2xl font-bold mb-4"
                    style={{ color: theme.primaryColor, fontSize: `${theme.fontSize}px` }}
                  >
                    预览标题
                  </div>
                  <p style={{ fontSize: `${theme.fontSize}px` }} className="text-gray-700">
                    这是内容预览区域，展示当前主题设置的效果。
                  </p>
                  <button
                    className="mt-4 px-4 py-2 text-white rounded-lg"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    预览按钮
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case '备份管理':
        return (
          <div className="space-y-6">
            <button
              onClick={() => setIsCreateBackupModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              创建备份
            </button>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">备份名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedBackups.map((backup) => (
                    <tr key={backup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{backup.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.size}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{backup.createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle(backup.status)}`}>
                          {backup.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <button onClick={() => handleDownloadBackup(backup)} className="text-blue-600 hover:text-blue-900">下载</button>
                        <button onClick={() => handleDeleteBackup(backup)} className="text-red-600 hover:text-red-900">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                共 {backups.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* 顶部Header */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">设置</h1>
        <p className="mt-1 text-sm text-gray-500">管理系统配置、主题样式和数据备份。</p>
      </div>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧导航 */}
        <div className="w-48 flex-shrink-0 border-r bg-white p-4">
          <nav className="space-y-2">
            {(['系统主题', '备份管理'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm ${
                  activeCategory === category
                    ? 'bg-brand-50 text-brand-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">{activeCategory}</h2>
          {renderContent()}
        </div>
      </div>

      {/* 创建备份弹窗 */}
      <CreateBackupModal
        isOpen={isCreateBackupModalOpen}
        onClose={() => setIsCreateBackupModalOpen(false)}
        onSubmit={handleCreateBackup}
      />
    </div>
  );
}
