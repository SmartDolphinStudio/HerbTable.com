# HerbTable

HerbTable is a creative curation platform with a public web experience, an
administration console, and small native services for application and security
workloads.

Status

This repository is under active development. The web applications currently use
local presentation data in several views; production integrations should be
implemented against the documented API before release.


## Architecture

- **Public site**: React, TypeScript, Vite, and Tailwind CSS.
- **Admin console**: React, TypeScript, Vite, and Tailwind CSS.
- **Application API**: Go HTTP service backed by MySQL and Redis.
- **Security service**: Rust/Axum service for password hashing, token handling,
  and authenticated encryption.
- **Captcha service**: Go HTTP service for behavioral captcha validation.
- **Edge**: Nginx serves static assets and proxies the public API.

For service boundaries and operational assumptions, see
[the architecture document](docs/ARCHITECTURE.md).


## Repository Layout

```text
cmd/api-server/        Go application API entry point
server/security/       Rust security service
server/captcha/        Go captcha service
web/public/            Public React application
web/admin/             Administration React application
configs/               Safe configuration templates
deployments/           Nginx and systemd deployment manifests
docs/                  Technical documentation
```
