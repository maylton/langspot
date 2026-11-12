#!/usr/bin/env bash
# Installs LangSpot for Linux (teacher app) for the current user.
#   ./install.sh               install / update
#   ./install.sh --reconfigure rewrite ~/.config/langspot/config.json from ../.env
#   ./install.sh --uninstall   remove the launcher, menu entry and icon (keeps the session in the keyring)
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HOME/.local/bin"
APPS="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICONS="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/scalable/apps"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}/langspot/config.json"
TAURI_ENTRY="$APPS/langspot.desktop"
PY="$(command -v python3)"

refresh_menus() {
    command -v update-desktop-database >/dev/null && update-desktop-database "$APPS" 2>/dev/null || true
    command -v gtk-update-icon-cache >/dev/null && gtk-update-icon-cache -q -t "${ICONS%/scalable/apps}" 2>/dev/null || true
}

if [ "${1:-}" = "--uninstall" ]; then
    rm -f "$BIN/langspot-linux" "$APPS/app.langspot.Teacher.desktop" "$ICONS/app.langspot.Teacher.svg"
    [ -f "$TAURI_ENTRY" ] && sed -i 's/^Name=LangSpot (Web)$/Name=LangSpot/' "$TAURI_ENTRY"
    refresh_menus
    echo "LangSpot para Linux removido."
    exit 0
fi

echo ":: Verificando dependências"
missing=()
"$PY" -c 'import gi; gi.require_version("Gtk","4.0"); gi.require_version("Adw","1")' 2>/dev/null || missing+=(libadwaita python-gobject)
"$PY" -c 'import gi; gi.require_version("Secret","1")' 2>/dev/null || missing+=(libsecret)
"$PY" -c 'import gi; gi.require_version("Gst","1.0"); from gi.repository import Gst; Gst.init(None); assert Gst.ElementFactory.find("opusdec") and Gst.ElementFactory.find("matroskademux")' 2>/dev/null \
    || missing+=(gst-plugins-good gst-plugins-base)
if ((${#missing[@]})); then
    echo "   Pacotes faltando: ${missing[*]}"
    echo "   Instale com: sudo pacman -S --needed ${missing[*]}"
fi

if [ ! -f "$CONFIG" ] || [ "${1:-}" = "--reconfigure" ]; then
    echo ":: Configurando a conexão com o LangSpot"
    ENV_FILE="$SRC/../.env"
    if [ ! -f "$ENV_FILE" ]; then
        echo "   Não encontrei $ENV_FILE. Crie $CONFIG com {\"url\": \"...\", \"anonKey\": \"...\"}." >&2
        exit 1
    fi
    mkdir -p "$(dirname "$CONFIG")"
    ( umask 077; "$PY" - "$ENV_FILE" "$CONFIG" <<'PYEOF'
import json, re, sys
env = dict(re.findall(r'^(VITE_SUPABASE_[A-Z_]+)=(.*)$', open(sys.argv[1], encoding='utf-8').read(), re.M))
url = env.get('VITE_SUPABASE_URL', '').strip().strip('"\'')
key = env.get('VITE_SUPABASE_ANON_KEY', '').strip().strip('"\'')
if not url or not key:
    sys.exit('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausente no .env')
json.dump({'url': url, 'anonKey': key}, open(sys.argv[2], 'w', encoding='utf-8'))
print('   Configuração salva em', sys.argv[2])
PYEOF
    )
fi

echo ":: Instalando o lançador em $BIN"
mkdir -p "$BIN" "$APPS" "$ICONS"
cat >"$BIN/langspot-linux" <<LAUNCHER
#!/bin/sh
export PYTHONPATH="$SRC\${PYTHONPATH:+:\$PYTHONPATH}"
exec "$PY" -m langspot_linux "\$@"
LAUNCHER
chmod +x "$BIN/langspot-linux"

echo ":: Adicionando ao menu de aplicativos"
sed "s|^Exec=langspot-linux|Exec=$BIN/langspot-linux|" "$SRC/data/app.langspot.Teacher.desktop" >"$APPS/app.langspot.Teacher.desktop"
cp "$SRC/data/icons/hicolor/scalable/apps/app.langspot.Teacher.svg" "$ICONS/"
# The Tauri (web) app keeps working, under a distinct name.
[ -f "$TAURI_ENTRY" ] && sed -i 's/^Name=LangSpot$/Name=LangSpot (Web)/' "$TAURI_ENTRY"
refresh_menus

echo "Pronto. Abra \"LangSpot\" no menu de aplicativos ou rode: langspot-linux"
