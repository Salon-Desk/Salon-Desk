#!/usr/bin/env bash
# One-time VPS prep (run as root or with sudo). Installs Docker and creates env path.
set -euo pipefail

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

install -d -m 0750 /opt/salondesk
if [ ! -f /opt/salondesk/.env ]; then
  echo "Create /opt/salondesk/.env from repo .env.example before first deploy."
fi

echo "VPS bootstrap complete. Add GitHub secrets: VPS_HOST, VPS_USER, VPS_SSH_KEY, GHCR_READ_TOKEN"
