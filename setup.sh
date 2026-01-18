#!/bin/bash
# Mac Development Environment Setup Script
# Usage: ./setup.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "=== delaxstudio Mac Setup ==="

# 1. Install Homebrew if not present
if ! command -v brew &>/dev/null; then
    echo "[1/6] Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    # Add brew to PATH for Apple Silicon
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "[1/6] Homebrew already installed"
fi

# 2. Install Homebrew packages
echo "[2/6] Installing Homebrew packages..."
brew bundle install --file="$SCRIPT_DIR/Brewfile"

if [ -f "$SCRIPT_DIR/Brewfile.extras" ]; then
    echo "  -> Installing extra packages..."
    brew bundle install --file="$SCRIPT_DIR/Brewfile.extras"
fi

# 3. Configure shell (.zshrc)
echo "[3/6] Configuring shell..."
ZSHRC="$HOME/.zshrc"
if ! grep -q "HOMEBREW_FORBIDDEN_FORMULAE" "$ZSHRC" 2>/dev/null; then
    cat >> "$ZSHRC" << 'EOF'

# Added by mac-setup
export HOMEBREW_FORBIDDEN_FORMULAE="node python python3 pip npm pnpm yarn"

# mise
if command -v mise >/dev/null 2>&1; then
  eval "$(mise activate zsh)"
fi

# starship prompt (optional)
# eval "$(starship init zsh)"
EOF
    echo "  -> .zshrc updated"
else
    echo "  -> .zshrc already configured"
fi

# 4. Setup mise (runtime versions)
echo "[4/6] Setting up mise..."
mkdir -p ~/.config/mise
cp "$SCRIPT_DIR/mise-config.toml" ~/.config/mise/config.toml
mise install
echo "  -> Node $(mise current node) installed"

# 5. Install Python packages
echo "[5/6] Installing Python packages..."
pip3 install -r "$SCRIPT_DIR/requirements.txt" --break-system-packages

# 6. Install VS Code extensions
echo "[6/6] Installing VS Code extensions..."
if command -v code &>/dev/null; then
    while IFS= read -r ext; do
        [[ "$ext" =~ ^#.*$ || -z "$ext" ]] && continue
        code --install-extension "$ext" --force
    done < "$SCRIPT_DIR/vscode-extensions.txt"
else
    echo "  -> VS Code CLI not found. Install extensions manually after VS Code setup."
fi

# 7. Cleanup Dock (remove all persistent apps)
echo "[7/7] Cleaning up Dock..."
defaults write com.apple.dock persistent-apps -array
defaults write com.apple.dock persistent-others -array
killall Dock
echo "  -> Dock icons cleared"

echo ""
echo "=== Setup Complete ==="
echo "Restart your terminal to apply shell changes."
