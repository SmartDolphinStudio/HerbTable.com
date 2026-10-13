# Architecture

## Overview

HerbTable consists of one browser application and two Go services. Nginx serves
the built web assets and routes API and captcha traffic to those services.

## Components

| Component | Location | Responsibility |
| --- | --- | --- |
| Public site | `web/public` | User-facing React application. |
| Application API | `cmd/api-server` | Health checks for the application API. |
| Captcha service | `server/captcha` | Behavioral captcha verification and signed captcha tokens. |

## Service Communication

```text
Browser -> Nginx -> Application API (:9002)
Browser -> Nginx -> Captcha service (:3001)
```

The API currently exposes `GET /health` and `GET /api/v1/health`. Account and
profile endpoints are not part of the current backend.

## Configuration

`configs/default.env` is a variable-only template. The captcha service requires
one signing secret from an ignored local environment file or host secret
manager:

- `CAPTCHA_SECRET`, at least 32 random bytes, for signing captcha tokens.

## Deployment

Use the API and captcha systemd unit templates and Nginx configuration in
`deployments/` as the starting point for host deployment. Build artifacts are
produced outside the repository and are intentionally not committed.

