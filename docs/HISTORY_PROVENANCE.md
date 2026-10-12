# History provenance and verifiable maintenance baseline

Audit baseline before remediation: `88cae488d129573dbd362e98e1888a61a611dda3`. Audit date: 2026-10-12. Maintained branch: `master`.

Git author/committer dates are user-controlled metadata. They do not independently establish when a project was written or first published. Original commits, tags and parent relationships are preserved. The cause of the discrepancies below is unknown; this document does not invent a migration explanation or attribute intent.

## HERB-GIT-001 — 2023 年提交包含 2025/2026 年才发布的 npm 版本

对历史 package.json 的每次修改查询官方 npm publish time，发现 28 个时间矛盾条目。例如 54b38fd170ea49189f064a3fe9e5978a1c0d498a 的时间为 2023-09-11，web/admin 已要求 @types/node ^26.1.2，该版本直到 2026-07-27 才发布。

Disposition: current-source errors are fixed in the new audit commit; earlier history is kept as evidence. Dates and titles in these commits must not be quoted as verified development/release events. Future releases identify their exact source commit, tested toolchain and CI run.

## HERB-GIT-002 — public package-lock.json 有未提交的平台元数据改动

本地 diff 修改顶层 name 格式并删除 13 个 Rollup 平台包的 libc glibc/musl 标记，没有更改包版本。

Disposition: current-source errors are fixed in the new audit commit; earlier history is kept as evidence. Dates and titles in these commits must not be quoted as verified development/release events. Future releases identify their exact source commit, tested toolchain and CI run.
