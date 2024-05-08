import { useState, useRef, useEffect, useMemo } from 'react';
import { Search, Send, Settings, X, Plus, Image, Film } from 'lucide-react';

/* ─── 类型定义 ─── */

/** 消息类型 */
interface Message {
  id: string;
  sender: 'user' | 'service';
  content: string;
  timestamp: string;
  imageUrl?: string;
}

/** 用户类型 */
interface ChatUser {
  id: string;
  name: string;
  avatar: string; // 首字母
  lastMessage: string;
  time: string;
  messages: Message[];
}

/** 用户设置类型 */
interface UserSettings {
  banPost: boolean;
  banPaid: boolean;
  withdrawRatio: number;
  balance: string;
  banAccount: boolean;
  role: string;
  remark: string;
}

/* ─── 模拟数据生成 ─── */

/** 用户名列表 */
const userNames = [
  '张三', '李四', '王五', '赵六', '孙七',
  '周八', '吴九', '郑十', 'user_001', 'user_002',
  'user_003', 'user_004', 'user_005', '陈晓明', '林小红',
  '黄大伟', '刘美丽', '杨志强', 'user_006', 'user_007',
  'user_008', 'user_009', 'user_010', '马晓东', '高小丽',
];

/** 消息内容池 */
const userMessages = [
  '你好，我想咨询一下订单问题',
  '我的账号好像出了一些问题，能帮忙看看吗？',
  '请问如何修改密码？',
  '充值一直没有到账，麻烦处理一下',
  '你们的客服电话是多少？',
  '我想退款，订单号是20240101',
  '页面打不开了，怎么回事？',
  '请问VIP有什么特权？',
  '我的提现申请什么时候能到？',
  '能不能帮我查一下最近的登录记录？',
  '系统提示我的账号异常，请帮忙解除',
  '我想升级会员，怎么操作？',
  '请问营业时间是什么时候？',
  '之前反馈的问题解决了吗？',
  '有没有优惠活动？',
  '我的优惠券怎么不能用？',
  '请问如何绑定手机号？',
  '服务器好像又挂了',
  '数据导出功能在哪里？',
  '我想注销账号',
];

const serviceMessages = [
  '您好，欢迎咨询客服，请问有什么可以帮您？',
  '好的，我这边帮您查看一下，请稍等。',
  '您的问题已经记录，我们会尽快处理。',
  '请您提供一下订单号，我帮您查询。',
  '密码修改请前往"个人中心-安全设置"进行操作。',
  '充值到账一般需要1-3个工作日，请您耐心等待。',
  '退款申请已提交，预计3-5个工作日到账。',
  'VIP特权包括：专属客服、优先处理、额外折扣等。',
  '提现申请已审核，预计24小时内到账。',
  '已为您排查，账号异常已解除，请重新登录。',
  '升级会员请在"个人中心-会员管理"中操作。',
  '优惠券使用规则请查看活动页面说明。',
  '绑定手机号请前往"安全设置"页面。',
  '服务器已恢复正常，给您带来不便深表歉意。',
  '数据导出功能在"工具-数据管理"中。',
];

/** 生成模拟时间 */
function generateTime(index: number): string {
  const now = Date.now();
  const offset = index * 3600000 * (1 + Math.random() * 2);
  const d = new Date(now - offset);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** 生成日期字符串 */
function generateDate(index: number): string {
  const now = Date.now();
  const offset = index * 86400000 * (0.5 + Math.random());
  const d = new Date(now - offset);
  if (offset < 86400000) return '今天';
  if (offset < 172800000) return '昨天';
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 生成模拟用户数据 */
function generateUsers(): ChatUser[] {
  return userNames.map((name, i) => {
    const msgCount = 2 + Math.floor(Math.random() * 4); // 2-5条
    const messages: Message[] = [];
    for (let j = 0; j < msgCount; j++) {
      const isUser = j % 2 === 0;
      messages.push({
        id: `${i}-${j}`,
        sender: isUser ? 'user' : 'service',
        content: isUser
          ? userMessages[Math.floor(Math.random() * userMessages.length)]
          : serviceMessages[Math.floor(Math.random() * serviceMessages.length)],
        timestamp: generateTime(j),
      });
    }
    const lastMsg = messages[messages.length - 1];
    return {
      id: `user-${i}`,
      name,
      avatar: name.charAt(0),
      lastMessage: lastMsg.content,
      time: generateDate(i),
      messages,
    };
  });
}

/* ─── 用户列表项组件 ─── */

function UserListItem({
  user,
  isActive,
  onClick,
}: {
  user: ChatUser;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3 transition-colors hover:bg-gray-50 ${
        isActive ? 'bg-blue-50 border-l-2 border-l-brand-600' : ''
      }`}
    >
      {/* 头像 - 首字母圆形 */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-medium text-white">
        {user.avatar}
      </div>
      {/* 用户信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate text-sm font-medium text-gray-900">{user.name}</span>
          <span className="shrink-0 text-xs text-gray-400">{user.time}</span>
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500">{user.lastMessage}</p>
      </div>
    </div>
  );
}

/* ─── 消息气泡组件 ─── */

function MessageBubble({ message }: { message: Message }) {
  const isService = message.sender === 'service';
  return (
    <div className={`flex ${isService ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          isService
            ? 'bg-brand-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.imageUrl && (
          <div className="mb-2 overflow-hidden rounded-lg">
            <img
              src={message.imageUrl}
              alt="uploaded"
              className="max-h-48 max-w-full object-cover"
            />
          </div>
        )}
        {message.content}
        <div
          className={`mt-1 text-right text-[10px] ${
            isService ? 'text-blue-200' : 'text-gray-400'
          }`}
        >
          {message.timestamp}
        </div>
      </div>
    </div>
  );
}

/* ─── 对话区域组件 ─── */

function ChatArea({
  user,
  messages,
  onSend,
}: {
  user: ChatUser | null;
  messages: Message[];
  onSend: (content: string) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  /** 消息列表自动滚动到底部 */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = inputValue.trim();
    if (!text) return;
    onSend(text);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <p className="text-gray-400">请从右侧选择一个用户开始对话</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* 对话头部 */}
      <div className="flex items-center gap-3 border-b bg-white px-6 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-xs font-medium text-white">
          {user.avatar}
        </div>
        <span className="text-sm font-semibold text-gray-900">{user.name}</span>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="border-t bg-white px-4 py-3">
        <div className="flex items-end gap-3">
          {/* 加号按钮 - 上传图片/视频 */}
          <button
            onClick={() => setShowMediaUpload(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-600"
            title="上传图片或视频"
          >
            <Plus size={18} />
          </button>
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息，Enter 发送..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* 媒体上传弹窗 */}
      {showMediaUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">上传媒体文件</h3>
              <button
                onClick={() => setShowMediaUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowMediaUpload(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <Image size={24} className="text-brand-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">上传图片</div>
                  <div className="text-sm text-gray-500">支持 JPG、PNG、GIF 格式</div>
                </div>
              </button>
              <button
                onClick={() => {
                  videoInputRef.current?.click();
                  setShowMediaUpload(false);
                }}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
              >
                <Film size={24} className="text-brand-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">上传视频</div>
                  <div className="text-sm text-gray-500">支持 MP4、MOV 格式</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            // 模拟上传
            const reader = new FileReader();
            reader.onload = (event) => {
              const newMessage: Message = {
                id: `msg-${Date.now()}`,
                sender: 'service',
                content: `[图片] ${file.name}`,
                timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
                imageUrl: event.target?.result as string,
              };
              setUserMessages((prev) => ({
                ...prev,
                [activeUserId]: [...(prev[activeUserId] || []), newMessage],
              }));
            };
            reader.readAsDataURL(file);
          }
          e.target.value = '';
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const newMessage: Message = {
              id: `msg-${Date.now()}`,
              sender: 'service',
              content: `[视频] ${file.name}`,
              timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
            };
            setUserMessages((prev) => ({
              ...prev,
              [activeUserId]: [...(prev[activeUserId] || []), newMessage],
            }));
          }
          e.target.value = '';
        }}
      />
    </div>
  );
}

/* ─── 用户设置弹窗组件 ─── */

function UserSettingsModal({
  user,
  settings,
  onClose,
  onSave,
  onSettingsChange,
}: {
  user: ChatUser | null;
  settings: UserSettings;
  onClose: () => void;
  onSave: () => void;
  onSettingsChange: (s: UserSettings) => void;
}) {
  const [resetMsg, setResetMsg] = useState(false);

  const handleResetPassword = () => {
    setResetMsg(true);
    setTimeout(() => setResetMsg(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      {/* 遮罩点击关闭 */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* 卡片 */}
      <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            用户设置{user ? ` - ${user.name}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* 设置项 */}
        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
          {/* 封禁发帖权利 */}
          <ToggleRow
            label="封禁发帖权利"
            checked={settings.banPost}
            onChange={(v) => onSettingsChange({ ...settings, banPost: v })}
          />

          {/* 封禁收费权利 */}
          <ToggleRow
            label="封禁收费权利"
            checked={settings.banPaid}
            onChange={(v) => onSettingsChange({ ...settings, banPaid: v })}
          />

          {/* 提现比例 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              提现比例
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={100}
                value={settings.withdrawRatio}
                onChange={(e) =>
                  onSettingsChange({ ...settings, withdrawRatio: Number(e.target.value) })
                }
                className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-gray-200 accent-brand-600"
              />
              <span className="w-12 text-right text-sm font-medium text-gray-900">
                {settings.withdrawRatio}%
              </span>
            </div>
          </div>

          {/* 账户余额 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              账户余额（元）
            </label>
            <input
              type="number"
              value={settings.balance}
              onChange={(e) => onSettingsChange({ ...settings, balance: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500"
              placeholder="请输入账户余额"
            />
          </div>

          {/* 封禁用户账号 */}
          <ToggleRow
            label="封禁用户账号"
            checked={settings.banAccount}
            onChange={(v) => onSettingsChange({ ...settings, banAccount: v })}
          />

          {/* 重置用户密码 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              重置用户密码
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetPassword}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
              >
                重置密码
              </button>
              {resetMsg && (
                <span className="text-sm text-green-600">密码已重置</span>
              )}
            </div>
          </div>

          {/* 用户角色 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              用户角色
            </label>
            <select
              value={settings.role}
              onChange={(e) => onSettingsChange({ ...settings, role: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500"
            >
              <option value="普通用户">普通用户</option>
              <option value="VIP">VIP</option>
              <option value="管理员">管理员</option>
            </select>
          </div>

          {/* 备注 */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              备注
            </label>
            <textarea
              value={settings.remark}
              onChange={(e) => onSettingsChange({ ...settings, remark: e.target.value })}
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500"
              placeholder="请输入备注信息..."
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="rounded-lg bg-brand-600 px-5 py-2 text-sm text-white transition-colors hover:bg-brand-700"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── 开关行组件 ─── */

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

/* ─── 主页面组件 ─── */

/**
 * 客服管理页面 - 聊天界面风格。
 * 三栏布局：左侧设置按钮、中间对话区域、右侧用户列表。
 */
export function CustomerServicePage() {
  // 用户数据
  const [users] = useState<ChatUser[]>(() => generateUsers());
  const [activeUserId, setActiveUserId] = useState<string>(users[0]?.id ?? '');
  const [searchQuery, setSearchQuery] = useState('');

  // 每个用户的消息状态（独立管理，支持发送新消息）
  const [userMessages, setUserMessages] = useState<Record<string, Message[]>>(() => {
    const map: Record<string, Message[]> = {};
    users.forEach((u) => {
      map[u.id] = [...u.messages];
    });
    return map;
  });

  // 用户设置弹窗
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    banPost: false,
    banPaid: false,
    withdrawRatio: 50,
    balance: '0.00',
    banAccount: false,
    role: '普通用户',
    remark: '',
  });

  /** 当前选中用户 */
  const activeUser = useMemo(
    () => users.find((u) => u.id === activeUserId) ?? null,
    [users, activeUserId],
  );

  /** 当前用户的消息列表 */
  const currentMessages = userMessages[activeUserId] ?? [];

  /** 过滤后的用户列表 */
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.lastMessage.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  /** 发送消息 */
  const handleSend = (content: string) => {
    const newMsg: Message = {
      id: `${activeUserId}-${Date.now()}`,
      sender: 'service',
      content,
      timestamp: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setUserMessages((prev) => ({
      ...prev,
      [activeUserId]: [...(prev[activeUserId] ?? []), newMsg],
    }));
  };

  /** 保存用户设置 */
  const handleSaveSettings = () => {
    setShowSettings(false);
  };

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* ── 页面标题 ── */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">客服管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          实时与用户沟通，管理用户会话与权限设置
        </p>
      </div>

      {/* ── 三栏主体 ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：用户设置按钮 */}
        <div className="flex w-14 flex-col items-center border-r bg-white py-4">
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-brand-600"
            title="用户设置"
          >
            <Settings size={20} />
          </button>
        </div>

        {/* 中间：对话区域 */}
        <ChatArea
          user={activeUser}
          messages={currentMessages}
          onSend={handleSend}
        />

        {/* 右侧：用户列表 */}
        <div className="flex w-72 flex-col border-l bg-white lg:w-80">
          {/* 搜索框 */}
          <div className="border-b px-3 py-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索用户..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-brand-500"
              />
            </div>
          </div>

          {/* 用户列表 */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-gray-400">无匹配用户</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <UserListItem
                  key={user.id}
                  user={user}
                  isActive={user.id === activeUserId}
                  onClick={() => setActiveUserId(user.id)}
                />
              ))
            )}
          </div>

          {/* 底部统计 */}
          <div className="border-t px-4 py-2">
            <span className="text-xs text-gray-400">
              共 {filteredUsers.length} 位用户
            </span>
          </div>
        </div>
      </div>

      {/* ── 用户设置弹窗 ── */}
      {showSettings && (
        <UserSettingsModal
          user={activeUser}
          settings={userSettings}
          onClose={() => setShowSettings(false)}
          onSave={handleSaveSettings}
          onSettingsChange={setUserSettings}
        />
      )}
    </div>
  );
}
