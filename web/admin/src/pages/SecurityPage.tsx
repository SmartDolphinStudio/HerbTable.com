import { useState, useRef, useEffect } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight, Trash2, Check } from 'lucide-react';

/* ─── Types ─── */

/** 安全页面主 Tab 定义 */
interface SecurityMainTab {
  id: string;
  label: string;
}

/** 防火墙子 Tab 定义 */
interface FirewallTab {
  id: string;
  label: string;
}

/** WAF 子 Tab 定义 */
interface WAFTab {
  id: string;
  label: string;
}

interface PortRule {
  protocol: string;
  port: string;
  status: string;
  policy: string;
  direction: string;
  source: string;
  note: string;
  time: string;
}

interface IPRule {
  ip: string;
  location: string;
  policy: string;
  status: string;
  note: string;
  time: string;
  expireTime: string;
}

interface PortForward {
  protocol: string;
  srcPort: string;
  destIP: string;
  destPort: string;
  status: string;
  note: string;
}

interface RegionRule {
  region: string;
  code: string;
  policy: string;
  status: string;
  note: string;
}

interface MaliciousIP {
  ip: string;
  location: string;
  status: string;
  note: string;
  banTime: string;
}

/** 黑白名单条目 */
interface BlackWhiteEntry {
  ip: string;
  location: string;
  type: '白名单' | '黑名单';
  note: string;
  addTime: string;
}

/* ─── Mock Data Generators ─── */

const protocols = ['tcp', 'udp', 'tcp/udp'];
const policies = ['放行', '拒绝', '丢弃'];
const directions = ['入站', '出站'];
const sources = ['所有IP', '192.168.1.0/24', '10.0.0.0/8', '172.16.0.0/12'];
const locations = ['中国-北京', '中国-上海', '中国-广州', '美国-加州', '日本-东京', '德国-法兰克福', '俄罗斯-莫斯科', '巴西-圣保罗'];
const regions = [
  { name: '中国', code: 'CN' }, { name: '美国', code: 'US' }, { name: '日本', code: 'JP' },
  { name: '韩国', code: 'KR' }, { name: '德国', code: 'DE' }, { name: '英国', code: 'GB' },
  { name: '法国', code: 'FR' }, { name: '俄罗斯', code: 'RU' }, { name: '印度', code: 'IN' },
  { name: '巴西', code: 'BR' }, { name: '澳大利亚', code: 'AU' }, { name: '加拿大', code: 'CA' },
  { name: '新加坡', code: 'SG' }, { name: '荷兰', code: 'NL' }, { name: '瑞典', code: 'SE' },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomTime(): string {
  const d = new Date(Date.now() - Math.random() * 30 * 86400000);
  return d.toLocaleDateString('zh-CN');
}

function generatePortRules(count: number): PortRule[] {
  const rules: PortRule[] = [];
  const commonPorts = ['20', '21', '22', '25', '53', '80', '110', '143', '443', '993', '995', '3306', '5432', '6379', '8080', '8443', '8888', '9090', '27017', '1521'];
  for (let i = 0; i < count; i++) {
    rules.push({
      protocol: randomFrom(protocols),
      port: i < commonPorts.length ? commonPorts[i] : `${Math.floor(Math.random() * 60000) + 1000}`,
      status: Math.random() > 0.3 ? '正常' : '未使用',
      policy: randomFrom(policies),
      direction: randomFrom(directions),
      source: randomFrom(sources),
      note: i < commonPorts.length ? `端口${commonPorts[i]}规则` : `自定义规则${i + 1}`,
      time: randomTime(),
    });
  }
  return rules;
}

function generateIPRules(count: number): IPRule[] {
  const rules: IPRule[] = [];
  for (let i = 0; i < count; i++) {
    rules.push({
      ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: randomFrom(locations),
      policy: randomFrom(policies),
      status: Math.random() > 0.2 ? '启用' : '禁用',
      note: `IP规则${i + 1}`,
      time: randomTime(),
      expireTime: Math.random() > 0.5 ? randomTime() : '永久',
    });
  }
  return rules;
}

function generatePortForwards(count: number): PortForward[] {
  const rules: PortForward[] = [];
  for (let i = 0; i < count; i++) {
    rules.push({
      protocol: randomFrom(protocols),
      srcPort: `${Math.floor(Math.random() * 60000) + 1000}`,
      destIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      destPort: `${Math.floor(Math.random() * 60000) + 1000}`,
      status: Math.random() > 0.2 ? '启用' : '禁用',
      note: `转发规则${i + 1}`,
    });
  }
  return rules;
}

function generateRegionRules(): RegionRule[] {
  return regions.map((r) => ({
    region: r.name,
    code: r.code,
    policy: randomFrom(policies),
    status: Math.random() > 0.3 ? '启用' : '禁用',
    note: `${r.name}访问规则`,
  }));
}

function generateMaliciousIPs(count: number): MaliciousIP[] {
  const ips: MaliciousIP[] = [];
  for (let i = 0; i < count; i++) {
    ips.push({
      ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: randomFrom(locations),
      status: '封禁',
      note: `恶意IP-${i + 1}`,
      banTime: randomTime(),
    });
  }
  return ips;
}

/** 生成黑白名单 mock 数据 */
function generateBlackWhiteList(): BlackWhiteEntry[] {
  const entries: BlackWhiteEntry[] = [];
  // 白名单 10 条
  for (let i = 0; i < 10; i++) {
    entries.push({
      ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: randomFrom(locations),
      type: '白名单',
      note: `白名单规则${i + 1}`,
      addTime: randomTime(),
    });
  }
  // 黑名单 10 条
  for (let i = 0; i < 10; i++) {
    entries.push({
      ip: `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      location: randomFrom(locations),
      type: '黑名单',
      note: `黑名单规则${i + 1}`,
      addTime: randomTime(),
    });
  }
  return entries;
}

/* ─── Pagination Hook ─── */

function usePagination<T>(data: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return { pageData, currentPage, totalPages, setPage, total: data.length };
}

/* ─── Pagination Component ─── */

function Pagination({
  currentPage,
  totalPages,
  total,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3">
      <span className="text-sm text-gray-600">共 {total} 条</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm text-gray-600">
          第 {currentPage} / {totalPages} 页
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded border border-gray-300 px-2 py-1 text-sm disabled:opacity-40 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── 功能开发中占位组件 ─── */

function UnderDevelopment() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-lg text-gray-400">功能开发中</p>
    </div>
  );
}

/* ─── 可横向滚动的 Tab 栏组件 ─── */

function ScrollableTabBar({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  /** 检查滚动位置以显示箭头 */
  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftArrow(el.scrollLeft > 0);
    setShowRightArrow(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = direction === 'left' ? -200 : 200;
    el.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  return (
    <div className="relative border-b bg-white">
      {/* 左箭头 */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 z-10 flex h-full items-center bg-white/90 px-1 shadow-sm border-r"
        >
          <ChevronLeft size={16} className="text-gray-500" />
        </button>
      )}
      {/* Tab 列表（可滚动） */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1 overflow-x-auto px-6 scrollbar-hide"
        style={{ scrollbarWidth: 'none' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* 右箭头 */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 z-10 flex h-full items-center bg-white/90 px-1 shadow-sm border-l"
        >
          <ChevronRight size={16} className="text-gray-500" />
        </button>
      )}
    </div>
  );
}

/* ─── 常量定义 ─── */

/** 安全页面主 Tab 列表 */
const securityMainTabs: SecurityMainTab[] = [
  { id: 'firewall', label: '系统防火墙' },
  { id: 'ssh', label: 'SSH管理' },
  { id: 'server-security', label: '服务器安全' },
  { id: 'website-security', label: '网站安全' },
  { id: 'security-scan', label: '安全扫描' },
  { id: 'ip-management', label: 'IP管理' },
  { id: 'scan-perception', label: '扫描感知' },
  { id: 'system-hardening', label: '系统加固' },
  { id: 'waf', label: 'WAF' },
  { id: 'dns-protection', label: 'DNS防护' },
];

/** 防火墙子 Tab 列表 */
const firewallTabs: FirewallTab[] = [
  { id: 'port', label: '端口规则' },
  { id: 'ip', label: 'IP规则' },
  { id: 'forward', label: '端口转发' },
  { id: 'region', label: '地区规则' },
  { id: 'malicious', label: '恶意IP自动封禁' },
  { id: 'blackwhite', label: '黑白名单' },
];

/** WAF 子 Tab 列表 */
const wafTabs: WAFTab[] = [
  { id: 'waf-hardening', label: '系统加固WAF' },
  { id: 'waf-attack-map', label: '攻击地图' },
  { id: 'waf-attack-report', label: '攻击报告' },
  { id: 'waf-global-settings', label: '全局设置' },
  { id: 'waf-site-settings', label: '站点设置' },
  { id: 'waf-block-log', label: '封锁记录' },
  { id: 'waf-operation-log', label: '操作日志' },
];

/* ─── Main Page ─── */

/**
 * Security page - 安全中心。
 * 顶部主 Tab 切换各安全模块，系统防火墙保留原有子 Tab 功能，
 * WAF 拥有独立子 Tab，其余模块显示"功能开发中"。
 */
export function SecurityPage() {
  // 主 Tab 状态
  const [mainTab, setMainTab] = useState('firewall');
  // 防火墙子 Tab 状态
  const [activeTab, setActiveTab] = useState('port');
  // WAF 子 Tab 状态
  const [wafSubTab, setWafSubTab] = useState('waf-hardening');
  // 防火墙控制状态
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [pingDisabled, setPingDisabled] = useState(false);

  // Mock 数据（使用 useMemo 风格，但保持与原始代码一致的渲染方式）
  const portRules = generatePortRules(45);
  const ipRules = generateIPRules(30);
  const portForwards = generatePortForwards(20);
  const regionRules = generateRegionRules();
  const maliciousIPs = generateMaliciousIPs(25);
  const blackWhiteList = generateBlackWhiteList();

  // 分页
  const portPagination = usePagination(portRules, 10);
  const ipPagination = usePagination(ipRules, 10);
  const forwardPagination = usePagination(portForwards, 10);
  const regionPagination = usePagination(regionRules, 10);
  const maliciousPagination = usePagination(maliciousIPs, 10);
  const blackWhitePagination = usePagination(blackWhiteList, 10);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* ── 页面标题 ── */}
      <div className="border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">安全</h1>
        <p className="mt-1 text-sm text-gray-500">系统安全防护与安全管理中心。</p>
      </div>

      {/* ── 顶部主 Tab 栏（可横向滚动） ── */}
      <ScrollableTabBar
        tabs={securityMainTabs}
        activeTab={mainTab}
        onTabChange={setMainTab}
      />

      {/* ── 系统防火墙模块 ── */}
      {mainTab === 'firewall' && (
        <>
          {/* 防火墙控制栏 + 缓存路径 */}
          <div className="flex items-center gap-6 border-b bg-white px-6 py-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">防火墙开关</span>
              <button
                onClick={() => setFirewallEnabled(!firewallEnabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${firewallEnabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${firewallEnabled ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">禁ping</span>
              <button
                onClick={() => setPingDisabled(!pingDisabled)}
                className={`relative h-6 w-11 rounded-full transition-colors ${pingDisabled ? 'bg-brand-600' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${pingDisabled ? 'left-[22px]' : 'left-0.5'}`}
                />
              </button>
            </div>
            <button className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              清理缓存
            </button>
            {/* 缓存路径显示 */}
            <span className="text-sm text-gray-500">
              缓存路径: <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">/tmp/server-admin/cache</code> (717 KB)
            </span>
          </div>

          {/* 防火墙子 Tab 导航 */}
          <div className="border-b bg-white px-6">
            <div className="flex gap-1">
              {firewallTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-brand-600 text-brand-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* 防火墙子 Tab 内容 */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'port' && (
              <PortRulesTab
                data={portPagination.pageData}
                pagination={portPagination}
              />
            )}
            {activeTab === 'ip' && (
              <IPRulesTab
                data={ipPagination.pageData}
                pagination={ipPagination}
              />
            )}
            {activeTab === 'forward' && (
              <PortForwardTab
                data={forwardPagination.pageData}
                pagination={forwardPagination}
              />
            )}
            {activeTab === 'region' && (
              <RegionRulesTab
                data={regionPagination.pageData}
                pagination={regionPagination}
              />
            )}
            {activeTab === 'malicious' && (
              <MaliciousIPTab
                data={maliciousPagination.pageData}
                pagination={maliciousPagination}
              />
            )}
            {activeTab === 'blackwhite' && (
              <BlackWhiteListTab
                data={blackWhitePagination.pageData}
                pagination={blackWhitePagination}
              />
            )}
          </div>
        </>
      )}

      {/* ── WAF 模块（含子 Tab） ── */}
      {mainTab === 'waf' && (
        <>
          {/* WAF 子 Tab 导航 */}
          <ScrollableTabBar
            tabs={wafTabs}
            activeTab={wafSubTab}
            onTabChange={setWafSubTab}
          />
          {/* WAF 子 Tab 内容（全部为开发中） */}
          <div className="flex-1 overflow-auto p-6">
            <UnderDevelopment />
          </div>
        </>
      )}

      {/* ── 其余模块：功能开发中 ── */}
      {mainTab !== 'firewall' && mainTab !== 'waf' && (
        <div className="flex-1 overflow-auto p-6">
          <UnderDevelopment />
        </div>
      )}
    </div>
  );
}

/* ── Port Rules Tab ─── */

function PortRulesTab({
  data,
  pagination,
}: {
  data: PortRule[];
  pagination: ReturnType<typeof usePagination<PortRule>>;
}) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">端口规则: {pagination.total}</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">IP规则: 0</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">端口转发: 0</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">地区规则: 0</span>
          <span className="text-sm text-gray-400">|</span>
          <span className="text-sm text-gray-600">恶意IP自动封禁: 0</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            添加端口规则
          </button>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="请输入端口/来源"
              className="rounded border border-gray-300 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">协议</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">端口</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">策略</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">方向</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">来源</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">时间</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((rule, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.protocol}</td>
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.port}</td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.status === '正常' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {rule.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.policy === '放行' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {rule.policy}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.direction}</td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.source}</td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.note}</td>
              <td className="px-4 py-2.5 text-sm text-gray-400">{rule.time}</td>
              <td className="px-4 py-2.5 text-sm">
                <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
                <button className="text-red-600 hover:text-red-700">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

/* ─── IP Rules Tab ── */

function IPRulesTab({
  data,
  pagination,
}: {
  data: IPRule[];
  pagination: ReturnType<typeof usePagination<IPRule>>;
}) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-gray-600">IP规则管理</span>
        <div className="flex items-center gap-2">
          <button className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            添加IP规则
          </button>
        </div>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP归属</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP地址</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">策略</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">时间</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">过期时间</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((rule, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.location}</td>
              <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{rule.ip}</td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.policy === '放行' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {rule.policy}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.status === '启用' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {rule.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.note}</td>
              <td className="px-4 py-2.5 text-sm text-gray-400">{rule.time}</td>
              <td className="px-4 py-2.5 text-sm text-gray-400">{rule.expireTime}</td>
              <td className="px-4 py-2.5 text-sm">
                <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
                <button className="text-red-600 hover:text-red-700">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

/* ─── Port Forward Tab ─── */

function PortForwardTab({
  data,
  pagination,
}: {
  data: PortForward[];
  pagination: ReturnType<typeof usePagination<PortForward>>;
}) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-gray-600">端口转发管理</span>
        <button className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
          添加转发规则
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">协议</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">源端口</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">目标IP</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">目标端口</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((rule, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.protocol}</td>
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.srcPort}</td>
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.destIP}</td>
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.destPort}</td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.status === '启用' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {rule.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.note}</td>
              <td className="px-4 py-2.5 text-sm">
                <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
                <button className="text-red-600 hover:text-red-700">删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

/* ─── Region Rules Tab ─── */

function RegionRulesTab({
  data,
  pagination,
}: {
  data: RegionRule[];
  pagination: ReturnType<typeof usePagination<RegionRule>>;
}) {
  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-gray-600">地区访问规则</span>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">地区</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">代码</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">策略</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((rule, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 text-sm text-gray-900">{rule.region}</td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.code}</td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.policy === '放行' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {rule.policy}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm">
                <span className={`rounded px-1.5 py-0.5 text-xs ${rule.status === '启用' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {rule.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{rule.note}</td>
              <td className="px-4 py-2.5 text-sm">
                <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

/* ─── Malicious IP Tab ─── */

function MaliciousIPTab({
  data,
  pagination,
}: {
  data: MaliciousIP[];
  pagination: ReturnType<typeof usePagination<MaliciousIP>>;
}) {
  const [releasedIPs, setReleasedIPs] = useState<Set<string>>(new Set());
  const [whitelistIPs, setWhitelistIPs] = useState<Set<string>>(new Set());
  const [blacklistIPs, setBlacklistIPs] = useState<Set<string>>(new Set());

  const handleRelease = (ip: string) => {
    setReleasedIPs((prev) => new Set(prev).add(ip));
  };

  const handleWhitelist = (ip: string) => {
    setWhitelistIPs((prev) => new Set(prev).add(ip));
    setBlacklistIPs((prev) => {
      const next = new Set(prev);
      next.delete(ip);
      return next;
    });
  };

  const handleBlacklist = (ip: string) => {
    setBlacklistIPs((prev) => new Set(prev).add(ip));
    setWhitelistIPs((prev) => {
      const next = new Set(prev);
      next.delete(ip);
      return next;
    });
  };

  return (
    <div className="rounded-lg bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-sm text-gray-600">恶意IP自动封禁列表</span>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP地址</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP归属地</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">封禁时间</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item, i) => {
            const isReleased = releasedIPs.has(item.ip);
            const isWhitelisted = whitelistIPs.has(item.ip);
            const isBlacklisted = blacklistIPs.has(item.ip);
            const currentStatus = isReleased ? '已放行' : isWhitelisted ? '白名单' : isBlacklisted ? '黑名单' : item.status;

            return (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{item.ip}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{item.location}</td>
                <td className="px-4 py-2.5 text-sm">
                  <span className={`rounded px-1.5 py-0.5 text-xs ${
                    currentStatus === '已放行' ? 'bg-green-100 text-green-800' :
                    currentStatus === '白名单' ? 'bg-blue-100 text-blue-800' :
                    currentStatus === '黑名单' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {currentStatus}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{item.note}</td>
                <td className="px-4 py-2.5 text-sm text-gray-400">{item.banTime}</td>
                <td className="px-4 py-2.5 text-sm">
                  {!isReleased && (
                    <button
                      onClick={() => handleRelease(item.ip)}
                      className="text-brand-600 hover:text-brand-700 mr-2"
                    >
                      放行
                    </button>
                  )}
                  <button
                    onClick={() => handleWhitelist(item.ip)}
                    className={`mr-2 ${isWhitelisted ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'}`}
                  >
                    白名单
                  </button>
                  <button
                    onClick={() => handleBlacklist(item.ip)}
                    className={`${isBlacklisted ? 'text-red-600 font-medium' : 'text-gray-500 hover:text-red-600'}`}
                  >
                    黑名单
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={pagination.setPage}
      />
    </div>
  );
}

/* ─── 黑白名单 Tab ─── */

function BlackWhiteListTab({
  data,
  pagination,
}: {
  data: BlackWhiteEntry[];
  pagination: ReturnType<typeof usePagination<BlackWhiteEntry>>;
}) {
  // 分离白名单和黑名单
  const whiteList = data.filter((e) => e.type === '白名单');
  const blackList = data.filter((e) => e.type === '黑名单');

  return (
    <div className="space-y-6">
      {/* ── 白名单表格 ── */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium text-gray-700">
            白名单 <span className="ml-1 text-gray-400">({pagination.total >= 10 ? 10 : pagination.total})</span>
          </span>
          <button className="flex items-center gap-1 rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            <Plus size={14} />
            添加白名单
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP地址</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP归属地</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">添加时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {whiteList.map((entry, i) => (
              <tr key={`w-${i}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{entry.ip}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{entry.location}</td>
                <td className="px-4 py-2.5 text-sm">
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                    {entry.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{entry.note}</td>
                <td className="px-4 py-2.5 text-sm text-gray-400">{entry.addTime}</td>
                <td className="px-4 py-2.5 text-sm">
                  <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
                  <button className="text-red-600 hover:text-red-700">删除</button>
                </td>
              </tr>
            ))}
            {whiteList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  暂无白名单数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── 黑名单表格 ── */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium text-gray-700">
            黑名单 <span className="ml-1 text-gray-400">({pagination.total >= 10 ? 10 : pagination.total})</span>
          </span>
          <button className="flex items-center gap-1 rounded bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 transition-colors">
            <Plus size={14} />
            添加黑名单
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP地址</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">IP归属地</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">备注</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">添加时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {blackList.map((entry, i) => (
              <tr key={`b-${i}`} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{entry.ip}</td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{entry.location}</td>
                <td className="px-4 py-2.5 text-sm">
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-800">
                    {entry.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-600">{entry.note}</td>
                <td className="px-4 py-2.5 text-sm text-gray-400">{entry.addTime}</td>
                <td className="px-4 py-2.5 text-sm">
                  <button className="text-brand-600 hover:text-brand-700 mr-2">修改</button>
                  <button className="text-red-600 hover:text-red-700">删除</button>
                </td>
              </tr>
            ))}
            {blackList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  暂无黑名单数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
