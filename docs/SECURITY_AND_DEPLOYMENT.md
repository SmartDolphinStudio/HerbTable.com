# Security and deployment

The Go API exposes only `GET /health` and `GET /api/v1/health`. It has no
account, persistence, or token-signing endpoints. The public login and
registration screens currently use client-side demo state.

The Go captcha service handles `/api/captcha/challenge` and
`/api/captcha/verify`. It keeps short-lived challenge state in memory, so run a
single instance unless shared storage is added. Set `CAPTCHA_SECRET` to at
least 32 random bytes. The captcha is a behavioral heuristic, not proof of
identity or authorization.

Nginx serves the public site and proxies `/api/captcha/` to the captcha service
and other `/api/` paths to the Go API. The systemd unit templates live in
`deployments/`; keep the captcha secret in the host's environment file.
