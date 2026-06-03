# Architecture

Overview

HerbTable consists of two browser applications and three independently
deployable native services. Nginx serves the built web assets and routes public
API and captcha traffic to their Go services. The Rust security service is
bound to loopback and is never exposed through Nginx.
