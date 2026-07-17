# Architecture

Overview

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
