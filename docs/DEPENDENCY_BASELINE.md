# Dependency baseline

The public frontend uses Node.js 24 and npm with its committed lockfile. Go
services use Go 1.26.0 or later; the API uses only the standard library and
the captcha service has no third-party module dependencies. There is no Rust,
MySQL, or Redis runtime in the current application stack.
