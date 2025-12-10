import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Home,
  Database,
  Code2,
  Activity,
  Shield,
  ScrollText,
  Terminal,
  Headphones,
  CalendarClock,
  Database as RedisIcon,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  LayoutDashboard,
  FolderOpen,
} from 'lucide-react';

/** Sidebar navigation item definition */
interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

/** All sidebar navigation items */
const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: <Home size={18} /> },
  { path: '/database', label: 'MySQL数据库', icon: <Database size={18} /> },
  { path: '/api', label: 'API', icon: <Code2 size={18} /> },
  { path: '/monitor', label: '监控', icon: <Activity size={18} /> },
  { path: '/security', label: '安全', icon: <Shield size={18} /> },
  { path: '/file', label: '文件', icon: <FolderOpen size={18} /> },
  { path: '/log', label: '日志', icon: <ScrollText size={18} /> },
  { path: '/terminal', label: '终端', icon: <Terminal size={18} /> },
  { path: '/customer-service', label: '客服管理', icon: <Headphones size={18} /> },
  { path: '/cron', label: '计划任务', icon: <CalendarClock size={18} /> },
  { path: '/redis', label: 'Redis', icon: <RedisIcon size={18} /> },
  { path: '/user-manage', label: '用户管理', icon: <Users size={18} /> },
  { path: '/post-manage', label: '帖子管理', icon: <MessageSquare size={18} /> },
  { path: '/settings', label: '设置', icon: <Settings size={18} /> },
];

/**
 * Admin layout with fixed sidebar and scrollable content area.
 */
export function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col bg-[#2d2d2d] text-gray-300">
        {/* Logo area */}
        <div className="flex h-14 items-center gap-2 px-4">
          <img src="/Image.png" alt="Logo" className="h-8 w-8 rounded object-cover" />
          <span className="text-sm font-semibold text-white">Herb Tale Console</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
          >
            <LogOut size={18} />
            <span>退出</span>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
