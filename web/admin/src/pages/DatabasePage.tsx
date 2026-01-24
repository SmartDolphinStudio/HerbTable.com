import { useState, useMemo } from 'react';
import { Database, Table2, Type, AlignLeft } from 'lucide-react';

/** Mock database statistics */
const dbStats = [
  { label: '数据库', value: '1', unit: '个', color: '#3b82f6' },
  { label: '数据表', value: '20+', unit: '张', color: '#22c55e' },
  { label: '总行数', value: '12.5K', unit: '行', color: '#8b5cf6' },
  { label: '数据库大小', value: '45.2', unit: 'MB', color: '#f59e0b' },
  { label: '连接数', value: '23', unit: '个', color: '#ec4899' },
  { label: '查询QPS', value: '156', unit: '/s', color: '#06b6d4' },
];

/** Mock table list */
const tables = [
  { name: 'account_activity', rows: 0 },
  { name: 'account_preferences', rows: 0 },
  { name: 'sd_admin_announcements', rows: 0 },
  { name: 'sd_admin_audit_events', rows: 0 },
  { name: 'sd_admin_backups', rows: 0 },
  { name: 'sd_admin_tasks', rows: 0 },
  { name: 'sd_admin_user_profile', rows: 0 },
  { name: 'sd_client_downloads', rows: 0 },
  { name: 'sd_site_feedback', rows: 0 },
  { name: 'sd_site_ip_rule', rows: 0 },
  { name: 'sd_site_maintenance', rows: 0 },
  { name: 'sd_site_popup', rows: 0 },
  { name: 'sd_site_rate_limits', rows: 0 },
  { name: 'sd_site_route_ban', rows: 0 },
  { name: 'site_metrics', rows: 0 },
  { name: 'support_conversations', rows: 0 },
  { name: 'support_messages', rows: 0 },
  { name: 'users', rows: 0 },
  { name: 'sd_admin_sessions', rows: 0 },
  { name: 'sd_site_notifications', rows: 0 },
  { name: 'sd_client_devices', rows: 0 },
];

interface ColumnDef {
  name: string;
  type: string;
  nullable: string;
  key: string;
  default: string;
  extra: string;
}

/** Seeded pseudo-random based on table name */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function seededRand(seed: number, index: number): number {
  const x = Math.sin(seed + index * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Field templates for different table categories */
const userFields: string[] = [
  'username', 'email', 'password_hash', 'salt', 'phone', 'avatar_url', 'nickname',
  'first_name', 'last_name', 'display_name', 'bio', 'date_of_birth', 'gender',
  'country', 'city', 'timezone', 'locale', 'status', 'is_verified', 'is_active',
  'last_login_at', 'login_count', 'failed_login_attempts', 'email_verified_at',
  'phone_verified_at', 'two_factor_enabled', 'two_factor_secret', 'remember_token',
  'stripe_customer_id', 'subscription_plan', 'role', 'permissions', 'metadata',
  'invited_by', 'referred_code', 'signup_source', 'signup_ip', 'last_active_ip',
  'deleted_at', 'banned_at',
];

const adminFields: string[] = [
  'admin_id', 'action', 'target_type', 'target_id', 'description', 'severity',
  'ip_address', 'user_agent', 'request_method', 'request_path', 'request_body',
  'response_code', 'response_time_ms', 'session_id', 'old_value', 'new_value',
  'diff_json', 'category', 'tags', 'is_system', 'scheduled_at', 'executed_at',
  'completed_at', 'retry_count', 'max_retries', 'error_message', 'stack_trace',
  'assigned_to', 'priority', 'status', 'resolution', 'notes', 'attachments',
  'related_event_id', 'batch_id', 'cron_expression', 'timeout_seconds',
];

const siteFields: string[] = [
  'title', 'content', 'summary', 'slug', 'category', 'tags', 'status', 'priority',
  'start_date', 'end_date', 'display_from', 'display_until', 'target_url',
  'image_url', 'thumbnail_url', 'icon', 'color', 'position', 'sort_order',
  'is_active', 'is_pinned', 'view_count', 'click_count', 'bounce_rate',
  'device_type', 'browser', 'os_type', 'referrer', 'utm_source', 'utm_medium',
  'utm_campaign', 'ip_address', 'user_id', 'session_id', 'page_path',
  'event_type', 'event_data', 'metadata', 'locale', 'region',
];

const supportFields: string[] = [
  'subject', 'message', 'conversation_id', 'sender_id', 'sender_type',
  'recipient_id', 'is_read', 'read_at', 'attachment_url', 'attachment_size',
  'channel', 'source', 'assigned_agent', 'agent_group', 'priority', 'sla_deadline',
  'first_response_at', 'last_response_at', 'resolved_at', 'closed_at',
  'satisfaction_rating', 'satisfaction_comment', 'tags', 'internal_notes',
  'escalation_count', 'transfer_count', 'parent_id', 'thread_id', 'template_id',
  'auto_reply', 'language', 'sentiment_score', 'category', 'sub_category',
];

const clientFields: string[] = [
  'client_id', 'version', 'platform', 'os_version', 'device_model', 'device_name',
  'screen_resolution', 'app_version', 'sdk_version', 'build_number', 'channel',
  'download_url', 'file_name', 'file_size', 'file_hash', 'checksum_md5',
  'release_notes', 'is_mandatory', 'min_supported_version', 'max_supported_version',
  'target_regions', 'rollout_percentage', 'staged_release', 'feedback_type',
  'rating', 'comment', 'screenshot_url', 'reproducible', 'steps_to_reproduce',
  'expected_result', 'actual_result', 'environment', 'crash_log', 'stack_trace',
  'network_type', 'battery_level', 'memory_usage', 'cpu_usage',
];

const metricFields: string[] = [
  'metric_name', 'metric_value', 'metric_unit', 'dimension', 'aggregation',
  'period', 'timestamp', 'source', 'environment', 'service', 'host', 'region',
  'datacenter', 'cluster', 'node', 'pod', 'container', 'labels', 'annotations',
  'threshold_warning', 'threshold_critical', 'alert_triggered', 'alert_acknowledged',
  'alert_resolved', 'percentile_p50', 'percentile_p90', 'percentile_p99',
  'mean', 'median', 'std_dev', 'min_value', 'max_value', 'sample_count',
  'error_count', 'success_count', 'total_count', 'rate', 'duration_ms',
];

const activityFields: string[] = [
  'actor_id', 'actor_type', 'action_type', 'entity_type', 'entity_id',
  'entity_name', 'changes', 'context', 'ip_address', 'user_agent', 'location',
  'latitude', 'longitude', 'session_id', 'request_id', 'trace_id', 'span_id',
  'duration_ms', 'status_code', 'error_message', 'metadata', 'tags',
  'notification_sent', 'notification_channel', 'processed_at', 'archived_at',
  'retention_days', 'compliance_flag', 'data_classification', 'pii_fields',
  'anonymized', 'consent_given', 'gdpr_request', 'exported_at', 'purged_at',
];

const backupFields: string[] = [
  'backup_name', 'backup_type', 'storage_type', 'storage_path', 'file_size_bytes',
  'compression', 'encryption', 'encryption_key_id', 'checksum', 'status',
  'started_at', 'finished_at', 'duration_seconds', 'tables_included', 'tables_excluded',
  'row_count', 'database_version', 'server_version', 'triggered_by', 'trigger_type',
  'cron_schedule', 'retention_policy', 'auto_delete_after', 'restore_count',
  'last_restored_at', 'verified', 'verified_at', 'verification_log',
  'replication_lag', 'binlog_position', 'gtid_set', 'slow_query_log',
  'error_log_path', 'config_snapshot', 'pre_backup_script', 'post_backup_script',
];

const templateMap: Record<string, string[]> = {
  users: userFields,
  account: userFields,
  support: supportFields,
  client: clientFields,
  metrics: metricFields,
  activity: activityFields,
  backup: backupFields,
  admin: adminFields,
  site: siteFields,
};

function getTemplateForTable(tableName: string): string[] {
  for (const [key, fields] of Object.entries(templateMap)) {
    if (tableName.includes(key)) return fields;
  }
  return siteFields;
}

/** Generate columns for a given table (30-40 fields) */
function generateColumns(tableName: string): ColumnDef[] {
  const seed = hashStr(tableName);
  const template = getTemplateForTable(tableName);
  const count = 30 + Math.floor(seededRand(seed, 999) * 11); // 30-40
  const fields: ColumnDef[] = [];

  // Always start with id
  fields.push({ name: 'id', type: 'INT', nullable: '否', key: 'PRI', default: 'NULL', extra: 'auto_increment' });

  const types = ['INT', 'BIGINT', 'VARCHAR(255)', 'VARCHAR(100)', 'VARCHAR(50)', 'TEXT', 'DATETIME', 'TIMESTAMP', 'DECIMAL(10,2)', 'DECIMAL(12,4)', 'BOOLEAN', "ENUM('active','inactive','pending')", 'JSON', 'TINYINT', 'MEDIUMTEXT', 'DATE', 'TIME'];
  const nullables = ['否', '是'];
  const keys = ['', '', '', '', 'MUL', 'MUL', 'UNI', ''];
  const defaults = ['NULL', 'NULL', 'NULL', '0', "''", '1', 'CURRENT_TIMESTAMP', '0.00', "'active'"];
  const extras = ['', '', '', '', 'auto_increment', 'on update CURRENT_TIMESTAMP', ''];

  const usedNames = new Set(['id']);
  for (let i = 0; i < count - 1; i++) {
    const r = (offset: number) => seededRand(seed, i * 17 + offset);
    let fname = template[i % template.length];
    if (usedNames.has(fname)) {
      fname = `${fname}_${i}`;
    }
    usedNames.add(fname);

    const typeIdx = Math.floor(r(1) * types.length);
    const nullableIdx = Math.floor(r(2) * nullables.length);
    const keyIdx = Math.floor(r(3) * keys.length);
    const defaultIdx = Math.floor(r(4) * defaults.length);
    const extraIdx = Math.floor(r(5) * extras.length);

    // First field after id gets created_at, second to last gets updated_at
    if (i === 0) {
      fields.push({ name: fname, type: 'TIMESTAMP', nullable: '否', key: '', default: 'CURRENT_TIMESTAMP', extra: '' });
    } else if (i === count - 2) {
      fields.push({ name: fname, type: 'TIMESTAMP', nullable: '是', key: '', default: 'NULL', extra: 'on update CURRENT_TIMESTAMP' });
    } else {
      const key = keys[keyIdx];
      let def = defaults[defaultIdx];
      if (key === 'PRI') def = 'NULL';
      fields.push({
        name: fname,
        type: types[typeIdx],
        nullable: nullables[nullableIdx],
        key,
        default: def,
        extra: extras[extraIdx],
      });
    }
  }

  // Ensure we have at least one MUL key
  if (!fields.some(f => f.key === 'MUL')) {
    fields[1].key = 'MUL';
  }

  return fields;
}

/** Generate CREATE TABLE SQL from columns */
function generateSQL(tableName: string, columns: ColumnDef[]): string {
  const lines: string[] = [];
  lines.push(`CREATE TABLE \`${tableName}\` (`);

  const colLines: string[] = [];
  const indexLines: string[] = [];

  for (const col of columns) {
    let line = `  \`${col.name}\` ${col.type}`;
    if (col.nullable === '否') line += ' NOT NULL';
    else line += ' DEFAULT NULL';
    if (col.default && col.default !== 'NULL' && col.nullable === '否') {
      if (col.default === 'CURRENT_TIMESTAMP') {
        line += ` DEFAULT ${col.default}`;
      } else {
        line += ` DEFAULT ${col.default}`;
      }
    }
    if (col.extra === 'auto_increment') line += ' AUTO_INCREMENT';
    if (col.extra === 'on update CURRENT_TIMESTAMP') line += ' ON UPDATE CURRENT_TIMESTAMP';
    colLines.push(line);

    if (col.key === 'PRI') {
      indexLines.push(`  PRIMARY KEY (\`${col.name}\`)`);
    } else if (col.key === 'UNI') {
      indexLines.push(`  UNIQUE KEY \`uni_${col.name}\` (\`${col.name}\`)`);
    } else if (col.key === 'MUL') {
      indexLines.push(`  KEY \`idx_${col.name}\` (\`${col.name}\`)`);
    }
  }

  lines.push([...colLines, ...indexLines].join(',\n'));
  lines.push(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;');
  return lines.join('\n');
}

/** Generate JSON metadata from columns */
function generateJSON(tableName: string, columns: ColumnDef[]): string {
  const cols = columns.map(col => {
    const obj: Record<string, unknown> = {
      name: col.name,
      type: col.type,
      nullable: col.nullable === '是',
      key: col.key || undefined,
      default: col.default === 'NULL' ? null : col.default,
    };
    if (col.extra) obj.extra = col.extra;
    return obj;
  });

  const indexes: { name: string; columns: string[]; type: string }[] = [];
  for (const col of columns) {
    if (col.key === 'PRI') indexes.push({ name: 'PRIMARY', columns: [col.name], type: 'BTREE' });
    else if (col.key === 'UNI') indexes.push({ name: `uni_${col.name}`, columns: [col.name], type: 'BTREE' });
    else if (col.key === 'MUL') indexes.push({ name: `idx_${col.name}`, columns: [col.name], type: 'BTREE' });
  }

  const data = {
    table: tableName,
    engine: 'InnoDB',
    charset: 'utf8mb4',
    collation: 'utf8mb4_unicode_ci',
    columns: cols,
    indexes,
  };

  return JSON.stringify(data, null, 2);
}

type ViewTab = 'fields' | 'sql' | 'json';

/**
 * MySQL Database management page.
 * Features: top metric cards, left table list sidebar, right content area with tabs.
 */
export function DatabasePage() {
  const [selectedTable, setSelectedTable] = useState('account_preferences');
  const [activeTab, setActiveTab] = useState<ViewTab>('fields');

  const columns = useMemo(() => generateColumns(selectedTable), [selectedTable]);
  const sqlText = useMemo(() => generateSQL(selectedTable, columns), [selectedTable, columns]);
  const jsonText = useMemo(() => generateJSON(selectedTable, columns), [selectedTable, columns]);

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">MySQL 数据库</h1>
          <p className="mt-1 text-sm text-gray-500">以目录和表结构方式浏览数据库。</p>
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          刷新
        </button>
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-6 gap-4 border-b bg-white px-6 py-4">
        {dbStats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 p-3">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded"
                style={{ backgroundColor: stat.color + '20' }}
              >
                <Database size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">
                  {stat.value}
                  <span className="ml-1 text-xs font-normal text-gray-500">{stat.unit}</span>
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: table list + detail view */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Table list */}
        <div className="w-64 flex-shrink-0 overflow-y-auto border-r bg-white">
          <div className="border-b px-4 py-3">
            <span className="text-sm font-medium text-gray-700">· {tables.length} 张表</span>
          </div>
          {tables.map((table) => (
            <button
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                selectedTable === table.name
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{table.name}</span>
              <span className="ml-2 text-xs text-gray-400">{table.rows}</span>
            </button>
          ))}
        </div>

        {/* Right: Detail view */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b bg-white px-4">
            <div className="flex">
              <TabButton
                active={activeTab === 'fields'}
                onClick={() => setActiveTab('fields')}
                icon={<Table2 size={14} />}
                label="字段"
              />
              <TabButton
                active={activeTab === 'sql'}
                onClick={() => setActiveTab('sql')}
                icon={<AlignLeft size={14} />}
                label="SQL"
              />
              <TabButton
                active={activeTab === 'json'}
                onClick={() => setActiveTab('json')}
                icon={<Type size={14} />}
                label="JSON"
              />
            </div>
            <p className="text-xs text-gray-400">
              只读浏览：字段、SQL 表结构和 JSON 元数据均不允许修改生产数据。
            </p>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto bg-white p-4">
            <h3 className="mb-3 text-base font-semibold text-gray-900">{selectedTable}</h3>

            {activeTab === 'fields' && <FieldsView columns={columns} />}
            {activeTab === 'sql' && <SQLView sql={sqlText} />}
            {activeTab === 'json' && <JSONView json={jsonText} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tab button component */
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Fields view: table showing column definitions */
function FieldsView({ columns }: { columns: ColumnDef[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">字段</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">类型</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">可空</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">键</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">默认值</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">额外</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {columns.map((col) => (
            <tr key={col.name} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-2.5 text-sm font-medium text-gray-900">{col.name}</td>
              <td className="px-4 py-2.5 text-sm text-gray-600">
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">{col.type}</code>
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">{col.nullable}</td>
              <td className="px-4 py-2.5 text-sm">
                {col.key && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                      col.key === 'PRI'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {col.key}
                  </span>
                )}
              </td>
              <td className="px-4 py-2.5 text-sm text-gray-600">
                <code className="text-xs">{col.default}</code>
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-400">{col.extra}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** SQL view: code block with syntax highlighting simulation */
function SQLView({ sql }: { sql: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-black">
      <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
        <span className="text-xs text-gray-400">SQL</span>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-sm leading-relaxed">
        <code>
          {sql.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-8 text-right text-gray-500 select-none">
                {i + 1}
              </span>
              <span className="text-gray-300">
                {highlightSQL(line)}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** JSON view: code block with syntax highlighting simulation */
function JSONView({ json }: { json: string }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-black">
      <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
        <span className="text-xs text-gray-400">JSON</span>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-sm leading-relaxed">
        <code>
          {json.split('\n').map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-8 text-right text-gray-500 select-none">
                {i + 1}
              </span>
              <span className="text-gray-300">
                {highlightJSON(line)}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Simple SQL syntax highlighting */
function highlightSQL(line: string): React.ReactNode {
  const keywords = ['CREATE', 'TABLE', 'NOT', 'NULL', 'AUTO_INCREMENT', 'DEFAULT', 'PRIMARY', 'KEY', 'ENGINE', 'CHARSET', 'COLLATE', 'ON', 'UPDATE', 'CURRENT_TIMESTAMP', 'VARCHAR', 'TEXT', 'INT', 'BIGINT', 'TIMESTAMP', 'DECIMAL', 'BOOLEAN', 'ENUM', 'JSON', 'TINYINT', 'MEDIUMTEXT', 'DATE', 'TIME', 'DATETIME', 'UNIQUE'];
  const parts = line.split(/(\s+|[()`,;])/);

  return parts.map((part, i) => {
    if (keywords.includes(part.toUpperCase())) {
      return <span key={i} className="text-purple-400 font-medium">{part}</span>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <span key={i} className="text-green-400">{part}</span>;
    }
    if (/^'.*'$/.test(part)) {
      return <span key={i} className="text-amber-300">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

/** Simple JSON syntax highlighting */
function highlightJSON(line: string): React.ReactNode {
  const parts = line.split(/("(?:[^"\\]|\\.)*")/g);

  return parts.map((part, i) => {
    if (part.startsWith('"') && part.endsWith('"')) {
      const inner = part.slice(1, -1);
      // Check if it's a key (followed by colon in original)
      if (line.trim().startsWith(part + ':') || line.trim().startsWith(part + ' :')) {
        return <span key={i} className="text-blue-400">{part}</span>;
      }
      // Known value strings
      if (['table', 'engine', 'charset', 'collation', 'name', 'type', 'nullable', 'key', 'default', 'extra', 'columns', 'indexes', 'PRI', 'MUL', 'UNI', 'BTREE', 'auto_increment', 'on update CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP', 'InnoDB', 'utf8mb4', 'utf8mb4_unicode_ci', ''].includes(inner)) {
        return <span key={i} className="text-amber-300">{part}</span>;
      }
      return <span key={i} className="text-green-400">{part}</span>;
    }
    // Numbers and booleans
    if (/^\d+$/.test(part.trim()) || part.trim() === 'true' || part.trim() === 'false' || part.trim() === 'null') {
      return <span key={i} className="text-orange-400">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
