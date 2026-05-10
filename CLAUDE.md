# mac-setup

両機 (Mac Studio / MacBook Pro) 共通の bootstrap + 開発環境宣言ファイル + dotfiles を git 管理するリポ。

## ディレクトリ構成

| パス | 役割 |
|------|------|
| `Brewfile` / `Brewfile.extras` | Homebrew formulae + casks の宣言ファイル |
| `npm-global-packages.txt` | npm global packages 宣言 (mise の node 配下に install) |
| `mise-config.toml` | mise で管理する language version (node 等) |
| `vscode-extensions-mbp.txt` / `vscode-extensions-studio.txt` | 各機の VSCode 拡張一覧 (canonical 統合は今後) |
| `dotfiles/` | 両機共通の shell / git / Claude Code 設定 (`zshrc` / `gitconfig` / `claude-settings.json` / `README.md`) |
| `claude/` | 旧 `~/.claude/commands/` の mirror (現在は claude-config が canonical で本 dir は補助的) |
| `agents/` | bootstrap 用 agents 雛形 |
| `tools/` | bootstrap 用 cli tools |
| `tasks/` | マシン間引き継ぎ task ファイル (git issue より重い計画ドキュメント) |
| `projects/` | machine-specific 開発リポ参照 (e.g., EnglishChrome submodule) |
| `docs/` | machine setup 関連の解説書類 |
| `setup.sh` | 新規マシン bootstrap スクリプト |
| `requirements.txt` | Python global packages |

## 主要コマンド

| コマンド | 用途 |
|----------|------|
| `brew bundle install --file=Brewfile` | Brewfile に declare されている formulae + casks を一括 install |
| `xargs -I{} npm install -g {} < npm-global-packages.txt` | npm global packages の install |
| `mise install` | mise で管理している language version を install |
| `xargs -I{} code --install-extension {} < vscode-extensions-mbp.txt` | VSCode 拡張の install (MBP 寄せ list) |
| `cp dotfiles/gitconfig ~/.gitconfig` | git commit author 適用 |
| `cp dotfiles/claude-settings.json ~/.claude/settings.json` | Claude Code settings 適用 (品質ゲート + plugins + hooks) |
| `bash setup.sh` | 新規マシン用 bootstrap (Brew + npm + mise + dotfiles を一括) |

## 技術スタック

- Homebrew (formulae + casks)
- mise (language version management)
- npm global (claude-code / clasp / gemini-cli / codex / qmd / wrangler / etc.)
- VSCode (両機 extensions union)
- 1Password CLI (`op`) — credentials の動的取得 (`op inject` / `op read`)
- Apple App Store Connect API (`.p8` ファイル本体は各機独自に `~/.appstoreconnect/` 配置)

## 実行環境

- macOS (Mac Studio / MacBook Pro / MacBook Air 共通)
- Homebrew prefix: `/opt/homebrew/` (MBP) / `~/brew/` (Mac Studio、ユーザー指定)
- 両機の状態は **手動 git push/pull** で揃える ([claude-config memory: multi-machine-agents](https://github.com/DELAxGithub/claude-config/blob/main/memory/multi-machine-agents.md))。自動同期 (Syncthing / memory-sync.sh / `/sync*`) は 2026-05-09 全廃
- 新ツール install と同時に本リポの宣言ファイルも更新する規律あり ([claude-config memory: feedback_dev_env_drift_2026-05-10](https://github.com/DELAxGithub/claude-config/blob/main/memory/feedback_dev_env_drift_2026-05-10.md))
- 両機 commit author は `Hiroshi Kodera <h.kodera@gmail.com>` で統一 (本リポの `dotfiles/gitconfig` 参照)
