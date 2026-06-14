#!/usr/bin/env bash
set -euo pipefail

echo "Instalando dependências do Tauri no Arch/CachyOS..."
sudo pacman -Syu --needed \
  webkit2gtk-4.1 \
  base-devel \
  curl \
  wget \
  file \
  openssl \
  appmenu-gtk-module \
  libappindicator-gtk3 \
  librsvg \
  xdotool \
  rustup

if ! rustup show active-toolchain >/dev/null 2>&1; then
  rustup default stable
fi

echo
echo "Dependências prontas."
echo "Reabra o terminal se cargo/rustc ainda não forem reconhecidos."
