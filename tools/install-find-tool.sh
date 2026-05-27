#!/bin/bash
# Install find-tool as ~/bin/find-tool symlink (idempotent).
# ~/bin is on PATH via mac-setup/dotfiles/zshrc.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$SCRIPT_DIR/find-tool"
BIN="$HOME/bin/find-tool"

if [[ ! -x "$TARGET" ]]; then
    chmod +x "$TARGET"
fi

mkdir -p "$HOME/bin"
if [[ -e "$BIN" && ! -L "$BIN" ]]; then
    echo "refusing to overwrite non-symlink $BIN" >&2
    exit 1
fi
ln -sf "$TARGET" "$BIN"

echo "Installed: $BIN -> $TARGET"
echo
echo "Try:"
echo "  find-tool whisper"
echo "  find-tool platto BGM --type memory"
echo "  find-tool davinci commander --format json --limit 5"
