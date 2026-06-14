#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo "Erro: o arquivo .env não foi encontrado." >&2
  echo "Restaure seu .env antes de criar o aplicativo." >&2
  exit 1
fi

npm ci
npm run check
npm run desktop:build

echo
echo "AppImage gerado em:"
find src-tauri/target/release/bundle/appimage -maxdepth 1 -name '*.AppImage' -print
