#!/usr/bin/env bash
set -euo pipefail

APPIMAGE="$1"
INSTALL_DIR="$HOME/.local/opt/langspot"
DESKTOP_DIR="$HOME/.local/share/applications"

mkdir -p "$INSTALL_DIR" "$DESKTOP_DIR"

cp "$APPIMAGE" "$INSTALL_DIR/LangSpot.AppImage"
chmod +x "$INSTALL_DIR/LangSpot.AppImage"

cat > "$DESKTOP_DIR/langspot.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=LangSpot
Comment=Dashboard para professores de idiomas
Exec=$INSTALL_DIR/LangSpot.AppImage
Icon=langspot
Terminal=false
Categories=Education;Office;
StartupNotify=true
StartupWMClass=LangSpot
EOF

chmod +x "$DESKTOP_DIR/langspot.desktop"
update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true

echo "LangSpot instalado no launcher."
