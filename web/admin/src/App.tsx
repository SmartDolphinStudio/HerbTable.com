import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardPage } from '@/pages/Dashboard';
import { DatabasePage } from '@/pages/DatabasePage';
import { APIPage } from '@/pages/APIPage';
import { MonitorPage } from '@/pages/MonitorPage';
import { SecurityPage } from '@/pages/SecurityPage';
import FilePage from '@/pages/FilePage';
import LogPage from '@/pages/LogPage';
import { TerminalPage } from '@/pages/TerminalPage';
import { CustomerServicePage } from '@/pages/CustomerServicePage';
import UserManagePage from '@/pages/UserManagePage';
import PostManagePage from '@/pages/PostManagePage';
import SettingsPage from '@/pages/SettingsPage';
import CronPage from '@/pages/CronPage';
import { RedisPage } from '@/pages/RedisPage';
import { LoginPage } from '@/pages/LoginPage';
import EmptyPage from '@/pages/EmptyPage';

/**
 * Root application component.
 * Configures routing with AdminLayout wrapper and all sidebar routes.
 */
export default function App() {
  return (
    <Routes>
      {/* Login page (outside admin layout) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin pages (inside admin layout) */}
      <Route element={<AdminLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/database" element={<DatabasePage />} />
        <Route path="/api" element={<APIPage />} />
        <Route path="/monitor" element={<MonitorPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/file" element={<FilePage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/terminal" element={<TerminalPage />} />
        <Route path="/customer-service" element={<CustomerServicePage />} />
        <Route path="/cron" element={<CronPage />} />
        <Route path="/redis" element={<RedisPage />} />
        <Route path="/website-manage" element={<EmptyPage title="网站管理" />} />
        <Route path="/user-manage" element={<UserManagePage />} />
        <Route path="/post-manage" element={<PostManagePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
