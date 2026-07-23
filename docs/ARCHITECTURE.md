# Architecture

## Overview

HerbTable consists of two browser applications and three independently
deployable native services. Nginx serves the built web assets and routes public
API and captcha traffic to their Go services. The Rust security service is
bound to loopback and is never exposed through Nginx.

## Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Public site | `web/public` | User-facing React application. |
| Admin console | `web/admin` | Administrative React application. |
| Application API | `cmd/api-server` | HTTP API, MySQL access, Redis token blocklist, and orchestration. |
| Security service | `server/security` | Argon2 password operations, JWT signing and verification, AES-256-GCM encryption. |
| Captcha service | `server/captcha` | Behavioral captcha verification and signed captcha tokens. |

## Service Communication

```text
Browser -> Nginx -> Application API (:9002) -> MySQL / Redis
                                    |
                                    +-> Security service (127.0.0.1:9001)
Browser -> Nginx -> Captcha service (:3001)
```

The security service accepts requests only from the local host. The application
API supplies password and token requests to it over the loopback interface.

## Configuration

`configs/default.env` is a variable-only template. Deployments must provide
credentials and cryptographic material through an ignored local environment
file or the host's secret-management mechanism. Required values are:

- `MYSQL_DSN` for the application database connection.
- `JWT_SECRET` for token signing and verification.
- `AES_KEY`, a 32-byte key encoded as 64 hexadecimal characters.
- `CAPTCHA_SECRET` for captcha token signing when the captcha service runs.

## Deployment

Use the systemd unit templates and Nginx configuration in `deployments/` as
the starting point for host deployment. Build artifacts are produced outside
the repository and are intentionally not committed.
