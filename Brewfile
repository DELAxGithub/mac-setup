# Homebrew Brewfile - delaxstudio dev environment
# Usage: brew bundle install --file=Brewfile

# Taps (none currently)

# Core development tools
brew "gh"           # GitHub CLI
brew "mise"         # Runtime version manager (node, python, etc.)
brew "starship"     # Shell prompt
brew "chezmoi"      # Dotfiles manager
brew "uv"           # Fast Python package manager

# Build tools
brew "autoconf"
brew "automake"
brew "bison"
brew "libtool"
brew "m4"
brew "meson"
brew "ninja"
brew "pkgconf"

# Media processing
brew "ffmpeg"       # Video/audio processing
brew "tesseract"    # OCR
brew "ghostscript"  # PDF processing
brew "poppler"      # PDF utilities (pdftotext, pdfinfo)
brew "exiftool"     # EXIF/GPS metadata (insta360-gps-probe, pdf-to-course)
brew "mpg123"       # MP3 decoder (podcast pipelines)

# Python / dev utilities
brew "pipx"         # Isolated Python CLI installs

# iOS development (fastlane / cocoapods workflow)
brew "cocoapods"
brew "fastlane"
brew "xcodes"       # Xcode version manager

# Cloud / data
brew "rclone"               # Cloud storage sync
brew "supabase/tap/supabase" # Supabase CLI
brew "cloudflared"          # Cloudflare tunnel (tachi-tracker etc.)

# Local LLM / analysis
brew "llama.cpp"    # Local LLM runtime (claude-local fallback)
brew "ollama"       # Optional local runtime / compatibility fallback
brew "yt-dlp"       # YouTube downloader (playlist-analyzer skill dependency)

# Git / VCS utilities
brew "git-filter-repo"  # History rewrite (post-leak hardening, 2026-05-09)
brew "ddrescue"         # Robust large-file copy (SD-import fcopyfile workaround)

# Terminal utilities
brew "tmux"         # Terminal multiplexer
brew "fileicon"     # Custom file icons

# Applications (Casks)
cask "visual-studio-code"
cask "obsidian"
cask "arc"
cask "dropbox"
cask "box-drive"
cask "logi-options+"
cask "macfuse"
cask "lm-studio"    # DELAX Agent Core local-Gemma client
