#!/usr/bin/env bash
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo -E bash "$0" "$@"
  fi
  echo "This script must be run as root (or with sudo)."
  exit 1
fi

if [ -r /etc/os-release ]; then
  . /etc/os-release
else
  echo "Cannot detect OS (/etc/os-release missing)."
  exit 1
fi

if [ "${ID:-}" != "ubuntu" ] && [ "${ID_LIKE:-}" != *"debian"* ]; then
  echo "Unsupported OS: ${ID:-unknown}. This script supports Ubuntu/Debian."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y --no-install-recommends ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

arch="$(dpkg --print-architecture)"
codename="$(lsb_release -cs)"

echo "deb [arch=${arch} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${codename} stable" > /etc/apt/sources.list.d/docker.list

apt-get update -y
apt-get install -y --no-install-recommends docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable --now docker

if ! getent group docker >/dev/null 2>&1; then
  groupadd docker
fi

target_user="${SUDO_USER:-}"
if [ -n "${target_user}" ] && id "${target_user}" >/dev/null 2>&1; then
  usermod -aG docker "${target_user}"
fi

docker --version
docker compose version
