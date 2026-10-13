# Audit remediation record

Original audit: 2026-10-12. This record maps the original finding IDs to changes in the new maintenance baseline. Historical facts retain their provenance limitations; code changes do not retrospectively authenticate old dates or commit titles.

This is a historical report for the pre-cleanup implementation. The current
service inventory is documented in `README.md` and `ARCHITECTURE.md`.

## Repository policy

The maintained branch uses the `Verify` CI check. Branch policy requires PRs, zero additional approvals for the single maintainer, resolved conversations and a current passing CI check, and rejects force pushes/deletion. Remote enforcement and exact new commit/CI IDs are verified after the audit push and recorded in the delivered cross-repository report. Security scan language scope is in `docs/SECURITY_SCAN_SCOPE.md`.

## GIT-001 — 六个默认分支均无保护规则或仓库 ruleset

Original evidence: GitHub branches API 对六个默认分支返回 protected=false；rulesets API 均返回空数组。分支保护 API 的 404 与这两个成功响应交叉印证。

Changes: Remote branch rules described above are enabled after the successful audit CI run.

Source references: workflow/configuration and history documents.

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## GIT-002 — 远端没有验证项目代码的自定义 CI 工作流

Original evidence: 六个默认分支均没有已跟踪的 .github/workflows 文件。DolphinPort Actions 中的动态 Dependabot Updates 不构成 Flutter/Rust/Android 构建验证；其余仓库 workflows 列表为空。DolphinPort 本地有被忽略的工作流，详见 DP-GIT-002。

Changes: 六仓库提交固定action SHA/Node/npm/pnpm/Go/Rust/Flutter/Foundry版本的可运行CI; CI包含构建、安全回归、官方依赖审计和Android APK原生payload检查

Source references: workflow/configuration and history documents.

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## GIT-003 — 安全告警 API 存在权限或功能缺口，不能以“无告警”判定安全

Original evidence: 六个仓库 Dependabot alerts 查询均失败，响应包含功能未启用和权限要求；多个 code-scanning/secret-scanning 查询返回 403/404。evm-patterns、MiniEVM 的 secret-scanning 查询成功且返回空列表，code-scanning 返回 no analysis found。逐接口状态在各项目远端表中完整列出。

Changes: 使用各仓库实际owner凭据消除安全告警读取权限缺口，启用Dependabot/secret scanning/push protection; 提交固定SHA CodeQL Actions/JS/Go/Rust扫描，明确Solidity/Dart不在CodeQL覆盖范围，区分404未配置与200无告警

Source references: workflow/configuration and history documents.

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## DEP-ENV-001 — 默认 npm 镜像不支持本次 audit 接口

Original evidence: 初次 npm audit 使用本机 registry.npmmirror.com，返回 404 Not Found / NOT_IMPLEMENTED。切换官方 registry.npmjs.org 后得到实际漏洞结果。该配置属于本机环境，不是六个项目均写入了此设置。

Changes: npm用户默认registry改官方npmjs，六仓库提交.npmrc并由CI显式审计; 移除冲突用户级GOROOT，默认go1.25.12与机器GOROOT一致；服务CI和本地验证显式使用Go1.26.5

Source references: workflow/configuration and history documents.

Validation: 默认go version/ go env GOROOT一致; npm config get registry=https://registry.npmjs.org/

## ENV-GO-001 — 默认 Go 可执行文件与 GOROOT 不匹配

Original evidence: 默认 go 是 1.25.12，但本机 GOROOT 指向 1.26.5，导致标准库 compile: version mismatch。改用 1.25.12 的目录后又出现标准库源码缺失。使用 C:\Dev\Go\1.26.5\bin\go.exe 并匹配 GOROOT 后，HerbTable API 和 UI captcha 后端 go vet 成功，HerbTable captcha 的未使用 import 被明确检出。

Changes: npm用户默认registry改官方npmjs，六仓库提交.npmrc并由CI显式审计; 移除冲突用户级GOROOT，默认go1.25.12与机器GOROOT一致；服务CI和本地验证显式使用Go1.26.5

Source references: workflow/configuration and history documents.

Validation: 默认go version/ go env GOROOT一致; npm config get registry=https://registry.npmjs.org/

## HERB-GIT-001 — 2023 年提交包含 2025/2026 年才发布的 npm 版本

Original evidence: 对历史 package.json 的每次修改查询官方 npm publish time，发现 28 个时间矛盾条目。例如 54b38fd170ea49189f064a3fe9e5978a1c0d498a 的时间为 2023-09-11，web/admin 已要求 @types/node ^26.1.2，该版本直到 2026-07-27 才发布。

Changes: 逐仓库提交历史可信边界/维护与发布基线文档，不改写或美化旧时间戳; Dolphin master唯一维护分支、旧main只读与新tag来源检查；EVM悬空commit建立本地保留ref; 疑点原因仍未知，不伪造迁移说明；未来开发事实以修复commit/CI/产物校验为据

Source references: workflow/configuration and history documents.

Validation: original Git object/metadata evidence is preserved; see HISTORY_PROVENANCE.md.

## HERB-GIT-002 — public package-lock.json 有未提交的平台元数据改动

Original evidence: 本地 diff 修改顶层 name 格式并删除 13 个 Rollup 平台包的 libc glibc/musl 标记，没有更改包版本。

Changes: 固定npm版本，脱离node_modules生成完整官方registry锁，npm ci及构建核验; chart引用配置纳入Git；保留public锁平台元数据修正并重建完整锁；Go tidy声明版本与模块图一致

Source references: `web/public/package-lock.json`

Validation: original Git object/metadata evidence is preserved; see HISTORY_PROVENANCE.md.

## HERB-BUILD-001 — admin TypeScript 检查出现 104 条错误

Original evidence: 隔离副本 npm ci 成功后 tsc -b 退出 2，输出 104 条 error TS；包括数据模型/组件 props 不匹配、未定义变量、ThemeContext API 不一致、CSS 模块声明和未使用符号。完整错误输出附后。

Changes: 统一metric/process/traffic类型和主题对象API，补CSS声明及严格未使用声明修复; 客服附件使用显式userId回调更新父级消息状态; 两个页面入口标注演示范围，保留完整后端接线验收边界

Source references: `web/admin/package.json`, `web/admin/src/types/index.ts`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-BUILD-002 — Go captcha 后端有未使用的 time import，无法编译

Original evidence: 使用匹配 GOROOT 的 Go 1.26.5 执行 go vet -mod=readonly ./... 明确返回 "time imported and not used"。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/captcha/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-BUILD-003 — go.mod 声明 Go 1.22，却留下需要更新的模块图

Original evidence: go mod tidy -diff 在副本中显示 go directive 改为 1.25.0，并删除未被当前程序导入的 golang.org/x/crypto v0.54.0 和 x/sys v0.47.0。Go 1.26.5 vet 可通过，但旧的目录重试提示 go.mod 需更新。

Changes: 固定npm版本，脱离node_modules生成完整官方registry锁，npm ci及构建核验; chart引用配置纳入Git；保留public锁平台元数据修正并重建完整锁；Go tidy声明版本与模块图一致

Source references: `cmd/api-server/go.mod`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-001 — 生成与校验 HMAC 的消息不同，自己生成的 token 无法通过校验

Original evidence: generateToken 对随机原始 32 字节签名，token 存其 hex；verifyToken 对 hex 文本的 ASCII 字节签名，未 hex decode。两种消息长度与内容均不同。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/captcha/main.go`, `server/captcha/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-002 — token 无过期/消费记录，验证行为数据完全由客户端提交

Original evidence: token 只含随机字节和签名，未编码时间/用户/用途，也没有存储消费状态；行为速度/轨迹/尝试次数由请求体报告，没有服务端挑战与尝试计数。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/captcha/main.go`, `server/captcha/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-003 — 登录/注册 API 未接入验证码结果

Original evidence: register/login 请求结构没有验证码 payload/token；处理流程也没有调用 captcha 验证服务。前端滑块交互不等于 API 已强制验证。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-004 — Nginx proxy_pass 尾斜杠会移除 API 实际需要的 /api 前缀

Original evidence: location /api/ 配 proxy_pass http://127.0.0.1:9002/；Go 路由注册 /api/v1/auth/...。Nginx 用 proxy_pass 的 URI / 替换匹配前缀，/api/v1/auth/login 到上游成为 /v1/auth/login。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `deployments/nginx.conf`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-005 — 共享 LISTEN_ADDR 与 admin upstream 的服务约定不一致

Original evidence: default.env LISTEN_ADDR=:9002，Go API 与 Rust security 都读取该变量；Rust 默认是 127.0.0.1:9001，但共享导出会改成 :9002。Nginx admin 的 /api/ 指向 3000，而仓库 API 默认9002，未发现3000对应管理后端。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `configs/default.env`, `server/security/src/main.rs`, `deployments/nginx.conf`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-006 — 登出忽略 Redis 写入错误，黑名单读取故障时放行

Original evidence: logout 的 Redis.Set(...).Err() 结果未处理；/me 只在 err==nil 且 exists>0 时拒绝，Redis 出错继续接受 JWT。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-007 — 登录和 /me 没有拒绝非 active 用户

Original evidence: 用户结构/数据库含 status，但 login 和 /me 流程没有依据 status 拒绝 banned/disabled 用户。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-008 — Rust 签名接口允许任意 sub/role；暴露后成为签名 oracle

Original evidence: JWT sign 接口接受调用者给定 sub/role/exp，没有内部服务认证；默认 loopback 限制降低暴露面，但共享 LISTEN_ADDR=:9002 可使其监听所有接口。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/security/src/main.rs`, `server/security/src/main.rs`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-009 — 同时保存 email 明文与 encrypted_email，无法提供邮箱字段保密

Original evidence: 数据库 schema 同时定义 email 和 encrypted_email；register insert 两者，email 明文并用作唯一查询字段。

Changes: 唯一email索引保存带密钥HMAC，email_encrypted保存AES密文；登录按HMAC查询，/me认证后解密; 启动时分批事务迁移旧明文记录，独立稳定EMAIL_LOOKUP_SECRET，异常数据不静默覆盖，备份留存边界说明

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-010 — Go HTTP 服务没有超时，API/captcha JSON 请求没有显式总量限制

Original evidence: 直接使用 http.ListenAndServe 的默认 Server，没有 ReadHeaderTimeout/ReadTimeout/WriteTimeout；Go API/captcha 的 JSON decoder 没有 MaxBytesReader。UI captcha 的 16KiB 限额不适用于这个项目。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`, `server/captcha/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-011 — Argon2 同步运行在 async handler，密码哈希存储未采用自描述格式

Original evidence: CPU/内存密集 Argon2 在 Tokio async handler 中同步执行；数据库返回自定义 salt.hexhash 格式，没有 PHC 算法/版本/成本字段。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/security/src/main.rs`, `server/security/src/main.rs`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-012 — 企业邮箱检查把用户 email 未转义拼入第三方 URL

Original evidence: 多处字符串拼接 email 到查询 URL，没有 url.QueryEscape；还把用户提交的地址发送给多家外部邮箱验证服务。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-013 — 查重后插入存在竞争，签 token 失败会留下已创建用户

Original evidence: register 先查重后 INSERT，唯一键竞争未映射为409；用户插入后再调用 security 服务获取 token，失败返回错误但不撤销已创建用户。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `cmd/api-server/main.go`, `cmd/api-server/main.go`, `cmd/api-server/main.go`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-014 — 客服页面引用不存在的 setUserMessages 和 activeUserId

Original evidence: 附件/消息相关回调引用 setUserMessages 与 activeUserId，但组件没有定义这些符号；tsc 分别报 TS2552/TS2304。

Changes: 统一metric/process/traffic类型和主题对象API，补CSS声明及严格未使用声明修复; 客服附件使用显式userId回调更新父级消息状态; 两个页面入口标注演示范围，保留完整后端接线验收边界

Source references: `web/admin/src/pages/CustomerServicePage.tsx`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-015 — 设置页把字符串 theme 当对象并调用不存在的 resetTheme

Original evidence: ThemeContext 的 theme 是字符串，setTheme 接受字符串；SettingsPage 使用 primaryColor/fontSize 等对象字段并传对象，resetTheme 不存在。

Changes: 统一metric/process/traffic类型和主题对象API，补CSS声明及严格未使用声明修复; 客服附件使用显式userId回调更新父级消息状态; 两个页面入口标注演示范围，保留完整后端接线验收边界

Source references: `web/admin/src/context/ThemeContext.tsx`, `web/admin/src/pages/SettingsPage.tsx`, `web/admin/src/pages/SettingsPage.tsx`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-016 — 前台/后台仍使用模拟登录和管理数据，没有完整真实权限链

Original evidence: 管理登录是本地模拟流程，管理路由没有真实认证 gate；多个前台页面/统计为 mock。后端虽然提供 auth API，但当前前端不等于已对接它。

Changes: 统一metric/process/traffic类型和主题对象API，补CSS声明及严格未使用声明修复; 客服附件使用显式userId回调更新父级消息状态; 两个页面入口标注演示范围，保留完整后端接线验收边界

Source references: `web/admin/src/pages/LoginPage.tsx`, `web/admin/src/App.tsx`, `README.md`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.

## HERB-017 — JWT_SECRET只检查变量存在，空值或弱密钥仍可进入签发和验证逻辑

Original evidence: env::var(...).expect(...)只拒绝未设置的变量，不拒绝空字符串；得到的原始字节直接传给HS256的EncodingKey和DecodingKey。配置模板JWT_SECRET为空，代码没有长度或强度校验。AES_KEY另有32字节校验，因此原样空模板会因AES_KEY报错，不能据此断言默认配置能直接启动。

Changes: 服务端短期挑战/会话绑定/原子消费，登录注册强制消费证明; Redis撤销失败关闭，账号状态检查，HTTP时间/体积边界; 独立loopback端口与内部服务认证，随机JWT密钥约束，PHC密码/阻塞池/旧hash迁移; 唯一约束冲突识别，先完成签发再插入用户，第三方邮箱查询显式同意/编码

Source references: `server/security/src/main.rs`, `server/security/src/main.rs`, `server/security/src/main.rs`, `configs/default.env`

Validation: applicable local builds/regression checks completed before committing; the committed Audit CI reproduces the build and tests on GitHub. Exact results are in the cross-repository delivery report.
