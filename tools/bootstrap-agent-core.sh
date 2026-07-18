#!/usr/bin/env bash
# Install the shared Codex-first agent configuration on a new Mac.

set -euo pipefail

AGENT_CORE_REPO="${DELAX_AGENT_CORE_REPO:-git@github.com:DELAxGithub/claude-config.git}"
AGENT_CORE_DIR="${DELAX_AGENT_CORE_DIR:-$HOME/src/claude-config}"
CANONICAL_FRAGMENT="github.com/DELAxGithub/claude-config"
CANONICAL_SSH_FRAGMENT="github.com:DELAxGithub/claude-config"

if [[ ! -d "$AGENT_CORE_DIR/.git" ]]; then
  mkdir -p "$(dirname "$AGENT_CORE_DIR")"
  echo "Cloning DELAX Agent Core into $AGENT_CORE_DIR"
  git clone "$AGENT_CORE_REPO" "$AGENT_CORE_DIR"
else
  current_remote="$(git -C "$AGENT_CORE_DIR" remote get-url origin)"
  if [[ "$current_remote" != *"$CANONICAL_FRAGMENT"* && "$current_remote" != *"$CANONICAL_SSH_FRAGMENT"* ]]; then
    echo "ERROR: $AGENT_CORE_DIR has an unexpected origin: $current_remote" >&2
    echo "Recover: choose a separate directory or restore the canonical checkout." >&2
    exit 2
  fi
  if [[ "$(git -C "$AGENT_CORE_DIR" branch --show-current)" != "main" ]]; then
    echo "ERROR: $AGENT_CORE_DIR is not on main; bootstrap will not change branches." >&2
    exit 2
  fi
  if [[ -n "$(git -C "$AGENT_CORE_DIR" status --porcelain)" ]]; then
    echo "ERROR: $AGENT_CORE_DIR has local changes; bootstrap will not overwrite them." >&2
    echo "Recover: commit, stash, or discard only the intended changes, then retry." >&2
    exit 2
  fi
  echo "Updating DELAX Agent Core with fast-forward only"
  git -C "$AGENT_CORE_DIR" pull --ff-only origin main
fi

python3 "$AGENT_CORE_DIR/scripts/generate-agent-preset.py"
python3 "$AGENT_CORE_DIR/scripts/install-agent-config.py" apply
python3 "$AGENT_CORE_DIR/scripts/install-agent-config.py" check

echo "DELAX Agent Core is installed. Future safe catch-up runs at login and every 6 hours."
