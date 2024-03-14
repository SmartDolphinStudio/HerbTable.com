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


## Prerequisites

- Node.js 20 or later
- Go 1.22 or later
- Rust stable toolchain
- MySQL and Redis for the application API


## Local Development

1. Create a local configuration file from `configs/default.env`. Keep it out
   of version control; `configs/local.env` is ignored by default.
2. Set non-empty values for `MYSQL_DSN`, `JWT_SECRET`, `AES_KEY`, and
   `CAPTCHA_SECRET`. `AES_KEY` must be a 64-character hexadecimal value.
3. Export the values from your local configuration file in the shell that runs
   the services.

Run the frontend applications in separate terminals:

```sh
cd web/public
npm ci
npm run dev
```

```sh
cd web/admin
npm ci
npm run dev
```

Run the backend services from the repository root:

```sh
(cd cmd/api-server && go run .)
cargo run --manifest-path server/security/Cargo.toml
(cd server/captcha && go run .)
```

The application API listens on `:9002` by default. The security service binds
to `127.0.0.1:9001` by default, and the captcha service listens on `:3001`.


## Build Verification

```sh
(cd web/public && npm run build)
(cd web/admin && npm run build)
(cd cmd/api-server && go test ./...)
cargo check --manifest-path server/security/Cargo.toml
(cd server/captcha && go test ./...)
```
