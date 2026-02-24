/**
 * 登录页面组件
 * 独立的登录页面，不在AdminLayout内
 * 使用Tailwind CSS实现简洁的工业级设计
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Shield } from 'lucide-react';

/**
 * 登录页面
 * 纯白色背景，居中登录卡片，简洁专业的设计
 */
export function LoginPage() {
  const navigate = useNavigate();
  
  // 表单状态
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [gaCode, setGaCode] = useState('');

  /**
   * 处理登录
   * 前端无验证，直接跳转到首页
   */
  const handleLogin = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* 登录卡片 */}
      <div className="w-full max-w-[400px] bg-white rounded-lg shadow-lg p-8">
        {/* Logo区域 */}
        <div className="flex flex-col items-center mb-8">
          {/* 品牌图标 */}
          <img src="/Image.png" alt="Logo" className="w-16 h-16 rounded-full object-cover mb-4" />
          {/* 标题 */}
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">清禾集叙</h1>
          {/* 副标题 */}
          <p className="text-sm text-gray-500">Herb Tale Console</p>
        </div>

        {/* 登录表单 */}
        <div className="space-y-5">
          {/* 用户名输入框 */}
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 密码输入框 */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Google Authenticator验证码输入框 */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
            type="text"
            placeholder="Google Authenticator 验证码"
            value={gaCode}
              onChange={(e) => setGaCode(e.target.value)}
              maxLength={6}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 登录按钮 */}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
          >
            登录
          </button>
        </div>
      </div>
    </div>
  );
}
