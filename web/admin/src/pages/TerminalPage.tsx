import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Settings, X, Upload, ChevronDown } from 'lucide-react';

/* ─── 类型定义 ─── */

interface AIConfig {
  modelName: string;
  apiKey: string;
  apiUrl: string;
}

interface ThemeConfig {
  bgColor: string;
  textColor: string;
  fontSize: number;
  opacity: number;
}

/* ─── 预设颜色 ─── */

const BG_COLORS = [
  { label: '经典黑', value: '#000000' },
  { label: '深灰', value: '#1a1a2e' },
  { label: '深蓝', value: '#0a192f' },
  { label: '深绿', value: '#0d1b0e' },
  { label: '深紫', value: '#1a0a2e' },
  { label: '深棕', value: '#1b1208' },
];

const TEXT_COLORS = [
  { label: '经典绿', value: '#00ff00' },
  { label: '白色', value: '#e0e0e0' },
  { label: '青色', value: '#00e5ff' },
  { label: '琥珀', value: '#ffb300' },
  { label: '粉色', value: '#ff80ab' },
  { label: '蓝色', value: '#82b1ff' },
];

const FONT_SIZES = [12, 14, 16, 18, 20];

/* ─── 模拟命令响应 ─── */

function getCommandOutput(cmd: string): string {
  const trimmed = cmd.trim();
  if (!trimmed) return '';

  const [command, ...args] = trimmed.split(/\s+/);

  switch (command.toLowerCase()) {
    case 'help':
      return [
        '可用命令:',
        '  ls [path]       - 列出目录内容',
        '  pwd             - 显示当前目录',
        '  whoami          - 显示当前用户',
        '  date            - 显示当前日期和时间',
        '  clear           - 清屏',
        '  echo <text>     - 输出文本',
        '  cat <file>      - 查看文件内容',
        '  uname [-a]      - 显示系统信息',
        '  uptime          - 显示运行时间',
        '  df [-h]         - 显示磁盘使用',
        '  free [-h]       - 显示内存使用',
        '  ps              - 显示进程列表',
        '  top             - 显示进程概览',
        '  hostname        - 显示主机名',
        '  id              - 显示用户ID信息',
        '  env             - 显示环境变量',
        '  history         - 显示命令历史',
        '  help            - 显示此帮助信息',
      ].join('\r\n');

    case 'ls':
      if (args[0] === '-la' || args[0] === '-al') {
        return [
          'total 48',
          'drwxr-xr-x  6 root root 4096 Jul 28 10:00 .',
          'drwxr-xr-x 18 root root 4096 Jul 20 08:30 ..',
          '-rw-------  1 root root  942 Jul 28 09:15 .bash_history',
          '-rw-r--r--  1 root root 3106 Apr  9  2024 .bashrc',
          'drwxr-xr-x  2 root root 4096 Jul 25 14:22 bin',
          'drwxr-xr-x  4 root root 4096 Jul 22 11:00 etc',
          'drwxr-xr-x  3 root root 4096 Jul 18 16:45 home',
          '-rw-r--r--  1 root root  571 Jul 28 10:00 index.html',
          'drwxr-xr-x  2 root root 4096 Jul 26 09:30 logs',
          '-rw-r--r--  1 root root  142 Apr  9  2024 .profile',
          '-rwxr-xr-x  1 root root 2048 Jul 27 15:00 server.sh',
          '-rw-r--r--  1 root root  893 Jul 26 12:00 system.conf',
        ].join('\r\n');
      }
      return 'bin  etc  home  index.html  logs  server.sh  system.conf';

    case 'pwd':
      return '/root';

    case 'whoami':
      return 'root';

    case 'date':
      return new Date().toString();

    case 'echo':
      return args.join(' ');

    case 'cat':
      if (!args[0]) return 'cat: 缺少文件参数';
      if (args[0] === 'system.conf') {
        return [
          '# System Configuration',
          'server.name=production-01',
          'server.port=8080',
          'database.host=localhost',
          'database.port=3306',
          'database.name=app_production',
          'log.level=info',
          'log.dir=/var/log/app',
        ].join('\r\n');
      }
      if (args[0] === 'index.html') {
        return [
          '<!DOCTYPE html>',
          '<html>',
          '<head><title>Welcome</title></head>',
          '<body>',
          '  <h1>Server is running</h1>',
          '</body>',
          '</html>',
        ].join('\r\n');
      }
      if (args[0] === 'server.sh') {
        return [
          '#!/bin/bash',
          '# Server startup script',
          'echo "Starting server..."',
          'cd /opt/app',
          'npm start &',
          'echo "Server started on port 8080"',
        ].join('\r\n');
      }
      return `cat: ${args[0]}: 没有那个文件或目录`;

    case 'uname':
      if (args[0] === '-a') {
        return 'Linux production-01 5.15.0-91-generic #101-Ubuntu SMP Tue Jul 15 10:23:42 UTC 2025 x86_64 GNU/Linux';
      }
      return 'Linux';

    case 'uptime':
      return ' 10:23:45 up 42 days,  3:15,  2 users,  load average: 0.12, 0.08, 0.05';

    case 'df':
      return [
        'Filesystem      Size  Used Avail Use% Mounted on',
        '/dev/sda1        50G   18G   30G  38% /',
        'tmpfs           3.9G     0  3.9G   0% /dev/shm',
        '/dev/sdb1       200G   85G  106G  45% /data',
      ].join('\r\n');

    case 'free':
      return [
        '              total        used        free      shared  buff/cache   available',
        'Mem:        8048576     2156324     3845216      128964     2047036     5612488',
        'Swap:       2097148           0     2097148',
      ].join('\r\n');

    case 'ps':
      return [
        '  PID TTY          TIME CMD',
        '    1 ?        00:00:03 systemd',
        '  423 ?        00:00:12 sshd',
        '  856 ?        00:01:45 nginx',
        ' 1024 ?        00:05:23 node',
        ' 1337 ?        00:02:10 mysql',
        ' 2048 pts/0    00:00:00 bash',
        ' 2156 pts/0    00:00:00 ps',
      ].join('\r\n');

    case 'top':
      return [
        'top - 10:23:45 up 42 days,  3:15,  2 users,  load average: 0.12, 0.08, 0.05',
        'Tasks: 128 total,   1 running, 127 sleeping,   0 stopped,   0 zombie',
        '%Cpu(s):  2.3 us,  0.8 sy,  0.0 ni, 96.5 id,  0.2 wa,  0.0 hi,  0.2 si',
        'MiB Mem :   7860.5 total,   3755.1 free,   2105.8 used,   1999.6 buff/cache',
        '',
        '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
        ' 1024 root      20   0  712456 125632  18944 S   1.3   1.6   5:23.45 node',
        ' 1337 mysql     20   0 1845236 356784   8960 S   0.7   4.4   2:10.12 mysqld',
        '  856 www-data  20   0   55232  12456   8732 S   0.3   0.2   1:45.67 nginx',
      ].join('\r\n');

    case 'hostname':
      return 'production-01';

    case 'id':
      return 'uid=0(root) gid=0(root) groups=0(root)';

    case 'env':
      return [
        'SHELL=/bin/bash',
        'USER=root',
        'HOME=/root',
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        'PWD=/root',
        'LANG=en_US.UTF-8',
        'TERM=xterm-256color',
        'SHLVL=1',
        'HOSTNAME=production-01',
      ].join('\r\n');

    case 'history':
      return [
        '  1  ls -la',
        '  2  cat system.conf',
        '  3  uptime',
        '  4  df -h',
        '  5  free -h',
        '  6  ps aux',
        '  7  whoami',
        '  8  date',
        '  9  help',
      ].join('\r\n');

    case 'exit':
      return '登出';

    default:
      return `bash: ${command}: 未找到命令`;
  }
}

/* ─── 终端页面主组件 ─── */

/**
 * 终端页面 - 使用 xterm.js 实现的真实终端模拟器
 * 包含模拟 shell 环境、终端配置面板、AI助手设置等功能
 */
export function TerminalPage() {
  /* ── 状态 ── */
  const [showConfig, setShowConfig] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    modelName: 'gpt-4',
    apiKey: '',
    apiUrl: 'https://api.openai.com',
  });
  const [theme, setTheme] = useState<ThemeConfig>({
    bgColor: '#000000',
    textColor: '#00ff00',
    fontSize: 14,
    opacity: 95,
  });

  /* ── Refs ── */
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const inputBufferRef = useRef('');
  const cursorPosRef = useRef(0);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const isCommandRunningRef = useRef(false);

  /* ── 终端初始化 ── */
  useEffect(() => {
    if (!terminalRef.current) return;

    // 创建终端实例
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"Cascadia Code", "Fira Code", "JetBrains Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: theme.fontSize,
      theme: {
        background: theme.bgColor,
        foreground: theme.textColor,
        cursor: theme.textColor,
        cursorAccent: theme.bgColor,
        selectionBackground: 'rgba(255, 255, 255, 0.2)',
      },
      allowTransparency: true,
      scrollback: 5000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // 欢迎信息
    const now = new Date();
    const lastLogin = new Date(now.getTime() - 86400000 * 2);
    term.writeln(`\x1b[1;32m╔══════════════════════════════════════════════════════╗\x1b[0m`);
    term.writeln(`\x1b[1;32m║\x1b[0m  \x1b[1;37mWelcome to Server Admin Terminal\x1b[0m                   \x1b[1;32m║\x1b[0m`);
    term.writeln(`\x1b[1;32m║\x1b[0m  \x1b[37mLast login: ${lastLogin.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}\x1b[0m  \x1b[1;32m║\x1b[0m`);
    term.writeln(`\x1b[1;32m╚══════════════════════════════════════════════════════╝\x1b[0m`);
    term.writeln('');
    term.writeln('\x1b[33m输入 "help" 查看可用命令\x1b[0m');
    term.writeln('');

    // 显示初始提示符
    writePrompt(term);

    // 键盘输入处理
    term.onData((data: string) => {
      if (isCommandRunningRef.current) return;
      handleInput(term, data);
    });

    // 窗口大小变化时重新适配
    const handleResize = () => {
      requestAnimationFrame(() => {
        try { fitAddon.fit(); } catch { /* ignore */ }
      });
    };
    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── 主题变化时更新终端样式 ── */
  useEffect(() => {
    if (!xtermRef.current) return;
    xtermRef.current.options = {
      ...xtermRef.current.options,
      fontSize: theme.fontSize,
      theme: {
        background: theme.bgColor,
        foreground: theme.textColor,
        cursor: theme.textColor,
        cursorAccent: theme.bgColor,
        selectionBackground: 'rgba(255, 255, 255, 0.2)',
      },
    };
  }, [theme]);

  /* ── 写入提示符 ── */
  function writePrompt(term: Terminal) {
    term.write(`\x1b[1;32mroot@production-01\x1b[0m:\x1b[1;34m~\x1b[0m$ `);
    inputBufferRef.current = '';
    cursorPosRef.current = 0;
  }

  /* ── 处理键盘输入 ── */
  function handleInput(term: Terminal, data: string) {
    // Enter 键
    if (data === '\r') {
      term.write('\r\n');
      const cmd = inputBufferRef.current;
      if (cmd.trim()) {
        commandHistoryRef.current.push(cmd);
        historyIndexRef.current = commandHistoryRef.current.length;
      }
      executeCommand(term, cmd);
      return;
    }

    // Backspace
    if (data === '\x7f') {
      if (inputBufferRef.current.length > 0 && cursorPosRef.current > 0) {
        const pos = cursorPosRef.current;
        const buf = inputBufferRef.current;
        inputBufferRef.current = buf.slice(0, pos - 1) + buf.slice(pos);
        cursorPosRef.current = pos - 1;
        // 重写当前行
        rewriteLine(term);
      }
      return;
    }

    // Ctrl+C
    if (data === '\x03') {
      term.write('^C\r\n');
      writePrompt(term);
      return;
    }

    // Ctrl+L (清屏)
    if (data === '\x0c') {
      term.clear();
      writePrompt(term);
      return;
    }

    // Tab 补全
    if (data === '\t') {
      const partial = inputBufferRef.current;
      const commands = ['ls', 'pwd', 'whoami', 'date', 'clear', 'help', 'echo', 'cat', 'uname', 'uptime', 'df', 'free', 'ps', 'top', 'hostname', 'id', 'env', 'history', 'exit'];
      const match = commands.filter(c => c.startsWith(partial));
      if (match.length === 1) {
        const completion = match[0].slice(partial.length);
        inputBufferRef.current += completion;
        cursorPosRef.current += completion.length;
        term.write(completion);
      }
      return;
    }

    // 左方向键
    if (data === '\x1b[D') {
      if (cursorPosRef.current > 0) {
        cursorPosRef.current--;
        term.write(data);
      }
      return;
    }

    // 右方向键
    if (data === '\x1b[C') {
      if (cursorPosRef.current < inputBufferRef.current.length) {
        cursorPosRef.current++;
        term.write(data);
      }
      return;
    }

    // 上方向键 - 历史命令
    if (data === '\x1b[A') {
      if (commandHistoryRef.current.length > 0 && historyIndexRef.current > 0) {
        historyIndexRef.current--;
        const cmd = commandHistoryRef.current[historyIndexRef.current];
        inputBufferRef.current = cmd;
        cursorPosRef.current = cmd.length;
        rewriteLine(term);
      }
      return;
    }

    // 下方向键 - 历史命令
    if (data === '\x1b[B') {
      if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
        historyIndexRef.current++;
        const cmd = commandHistoryRef.current[historyIndexRef.current];
        inputBufferRef.current = cmd;
        cursorPosRef.current = cmd.length;
        rewriteLine(term);
      } else {
        historyIndexRef.current = commandHistoryRef.current.length;
        inputBufferRef.current = '';
        cursorPosRef.current = 0;
        rewriteLine(term);
      }
      return;
    }

    // 可打印字符
    if (data >= ' ') {
      const pos = cursorPosRef.current;
      const buf = inputBufferRef.current;
      inputBufferRef.current = buf.slice(0, pos) + data + buf.slice(pos);
      cursorPosRef.current = pos + data.length;
      rewriteLine(term);
    }
  }

  /* ── 重写当前输入行 ── */
  function rewriteLine(term: Terminal) {
    // 回到行首，清除当前行，重新写入
    const prefixLen = 'root@production-01:~$ '.length;
    const totalLen = prefixLen + inputBufferRef.current.length;
    term.write(`\x1b[2K\x1b[${prefixLen + 1}G`);
    term.write(inputBufferRef.current);
    // 移动光标到正确位置
    const diff = inputBufferRef.current.length - cursorPosRef.current;
    if (diff > 0) {
      term.write(`\x1b[${diff}D`);
    }
  }

  /* ── 执行命令（带延迟模拟） ── */
  async function executeCommand(term: Terminal, cmd: string) {
    const trimmed = cmd.trim();

    if (!trimmed) {
      writePrompt(term);
      return;
    }

    // clear 命令特殊处理
    if (trimmed === 'clear') {
      term.clear();
      writePrompt(term);
      return;
    }

    isCommandRunningRef.current = true;

    // 模拟命令执行延迟
    const delay = Math.random() * 200 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));

    const output = getCommandOutput(trimmed);
    if (output) {
      // 模拟逐行输出效果
      const lines = output.split('\r\n');
      for (let i = 0; i < lines.length; i++) {
        term.writeln(lines[i]);
        if (lines.length > 3) {
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      }
    }

    term.write('\r\n');
    writePrompt(term);
    isCommandRunningRef.current = false;
  }

  /* ── 保存 AI 配置 ── */
  const handleSaveAiConfig = useCallback(() => {
    // 模拟保存
    setShowConfig(false);
  }, []);

  /* ── 渲染 ── */
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: `rgba(0, 0, 0, ${theme.opacity / 100})` }}
    >
      {/* 终端容器 */}
      <div
        ref={terminalRef}
        className="h-full w-full"
        style={{ padding: '8px' }}
      />

      {/* 右上角配置按钮 */}
      <button
        onClick={() => setShowConfig(true)}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/70 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
        title="终端配置"
      >
        <Settings size={20} />
      </button>

      {/* 配置弹窗 */}
      {showConfig && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="relative mx-4 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-gray-900 p-6 shadow-2xl ring-1 ring-white/10">
            {/* 弹窗标题 */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">终端配置</h2>
              <button
                onClick={() => setShowConfig(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* ── AI 终端助手 ── */}
            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-300">AI 终端助手</h3>
                <button
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${aiEnabled ? 'bg-emerald-500' : 'bg-gray-600'}`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${aiEnabled ? 'left-[22px]' : 'left-0.5'}`}
                  />
                </button>
              </div>

              {aiEnabled && (
                <div className="space-y-3 rounded-xl bg-white/5 p-4">
                  {/* AI 模型名称 */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">AI 模型名称</label>
                    <input
                      type="text"
                      value={aiConfig.modelName}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))}
                      placeholder="如 gpt-4"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">API Key</label>
                    <input
                      type="password"
                      value={aiConfig.apiKey}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>

                  {/* API 地址 */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-400">API 地址</label>
                    <input
                      type="text"
                      value={aiConfig.apiUrl}
                      onChange={(e) => setAiConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                      placeholder="https://api.openai.com"
                      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-emerald-500"
                    />
                  </div>

                  {/* 保存按钮 */}
                  <button
                    onClick={handleSaveAiConfig}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                  >
                    保存配置
                  </button>
                </div>
              )}
            </div>

            {/* 分隔线 */}
            <div className="mb-6 h-px bg-white/10" />

            {/* ── 智能提醒 ── */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-300">智能提醒</h3>
              <div className="rounded-xl bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-sm text-gray-300">智能提醒已默认开启</span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  终端会自动识别命令并给出安全提示与优化建议
                </p>
              </div>
            </div>

            {/* 分隔线 */}
            <div className="mb-6 h-px bg-white/10" />

            {/* ── 终端主题 ── */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-medium text-gray-300">终端主题</h3>

              {/* 背景颜色 */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-gray-400">背景颜色</label>
                <div className="flex flex-wrap gap-2">
                  {BG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setTheme(prev => ({ ...prev, bgColor: color.value }))}
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${
                        theme.bgColor === color.value
                          ? 'border-emerald-400 scale-110'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* 背景图片上传（模拟） */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-gray-400">背景图片</label>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-gray-400 transition-colors hover:border-white/40 hover:text-gray-300">
                  <Upload size={16} />
                  <span>上传图片</span>
                </button>
              </div>

              {/* 背景透明度 */}
              <div className="mb-4">
                <label className="mb-2 flex items-center justify-between text-xs text-gray-400">
                  <span>背景透明度</span>
                  <span className="text-gray-300">{theme.opacity}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={theme.opacity}
                  onChange={(e) => setTheme(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* 文字颜色 */}
              <div className="mb-4">
                <label className="mb-2 block text-xs text-gray-400">文字颜色</label>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setTheme(prev => ({ ...prev, textColor: color.value }))}
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${
                        theme.textColor === color.value
                          ? 'border-emerald-400 scale-110'
                          : 'border-white/10 hover:border-white/30'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              {/* 字体大小 */}
              <div>
                <label className="mb-2 block text-xs text-gray-400">字体大小</label>
                <div className="relative">
                  <select
                    value={theme.fontSize}
                    onChange={(e) => setTheme(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-8 text-sm text-white outline-none transition-colors focus:border-emerald-500"
                  >
                    {FONT_SIZES.map((size) => (
                      <option key={size} value={size} className="bg-gray-800 text-white">
                        {size}px
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* 关闭按钮 */}
            <button
              onClick={() => setShowConfig(false)}
              className="w-full rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
