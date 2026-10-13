# HerbTable

HerbTable is a creative curation platform with a public web experience, a small
Go health API, and a Go captcha service.

## Status

This repository is under active development. The public web application uses
local presentation data, and its login and registration screens are client-side
demos. The Go API currently exposes health checks only.

## Architecture

- **Public site**: React, TypeScript, Vite, and Tailwind CSS.
- **Application API**: Go HTTP service exposing health checks.
- **Captcha service**: Go HTTP service for behavioral captcha validation.
- **Edge**: Nginx serves static assets and proxies the public API.

For service boundaries and operational assumptions, see
[the architecture document](docs/ARCHITECTURE.md).

## Repository Layout

```text
cmd/api-server/        Go application API entry point
server/captcha/        Go captcha service
web/public/            Public React application
configs/               Safe configuration templates
deployments/           Nginx and systemd deployment manifests
docs/                  Technical documentation
```

## Prerequisites

- Node.js 24 or later
- Go 1.26.0 or later

## Local Development

1. Create a local configuration file from `configs/default.env`. Keep it out
   of version control; `configs/local.env` is ignored by default.
2. Set `CAPTCHA_SECRET` to at least 32 random bytes and export the values from
   your local configuration file in the shell that runs the services.

Run the public frontend:

```sh
cd web/public
npm ci
npm run dev
```

Run each backend service in a separate terminal from the repository root:

```sh
(cd cmd/api-server && go run .)
(cd server/captcha && go run .)
```

The API listens on `127.0.0.1:9002` by default, and the captcha service listens
on `127.0.0.1:3001`. Vite proxies `/api/` requests to these local services.

## Build Verification

```sh
(cd web/public && npm run build)
(cd cmd/api-server && go build ./...)
(cd server/captcha && go test ./...)
```

## Configuration and Security

Never commit credentials, private keys, host files, generated archives, or
environment-specific configuration. The repository ignores `.ssh/`, local
environment files, build output, and ZIP archives. Report security
issues according to [SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

Distributed under the [MIT License](LICENSE).

