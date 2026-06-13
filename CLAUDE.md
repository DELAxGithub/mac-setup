# mac-setup

MacBook Pro（現メイン機 / 唯一の稼働機）の bootstrap + 開発環境宣言ファイル + dotfiles を git 管理するリポ。元は Mac Studio ⇔ MBP の両機共通設定として作ったが、Mac Studio は **2026-06 引退**。宣言ファイル群は新規マシン（MacBook Air 等）の bootstrap にそのまま再利用できる形で残してある。

## ディレクトリ構成

| パス | 役割 |
|------|------|
| `Brewfile` / `Brewfile.extras` | Homebrew formulae + casks の宣言ファイル |
| `npm-global-packages.txt` | npm global packages 宣言 (mise の node 配下に install) |
| `mise-config.toml` | mise で管理する language version (node 等) |
| `vscode-extensions-mbp.txt` | MBP の VSCode 拡張一覧 (canonical)。`vscode-extensions-studio.txt` は引退した Mac Studio の記録（参考のみ） |
| `dotfiles/` | shell / git / Claude Code 設定 (`zshrc` / `gitconfig` / `claude-settings.json` / `README.md`) |
| `claude/` | 旧 `~/.claude/commands/` の mirror (現在は claude-config が canonical で本 dir は補助的) |
| `agents/` | bootstrap 用 agents 雛形 |
| `tools/` | bootstrap 用 cli tools |
| `tasks/` | セッション間引き継ぎ task ファイル (git issue より重い計画ドキュメント。旧・マシン間引き継ぎ) |
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
| `bash tools/install-find-tool.sh` | `find-tool` CLI を `~/bin/find-tool` に install。`~/src/` 横断全文検索（[tools/README.md](tools/README.md)） |

## 技術スタック

- Homebrew (formulae + casks)
- mise (language version management)
- npm global (claude-code / clasp / gemini-cli / codex / qmd / wrangler / etc.)
- VSCode extensions
- 1Password CLI (`op`) — credentials の動的取得 (`op inject` / `op read`)
- Apple App Store Connect API (`.p8` ファイル本体は各機独自に `~/.appstoreconnect/` 配置)

## 実行環境

- macOS — **MacBook Pro がメイン機 / 唯一の稼働機**。Mac Studio は 2026-06 引退。MacBook Air は予備（bootstrap 対象として想定可）
- Homebrew prefix: `/opt/homebrew/` (MBP / Apple Silicon 標準)。旧 Mac Studio は `~/brew/`（ユーザー指定）だった（引退）
- 設定は **git push/pull** でバックアップ・履歴管理 ([claude-config memory: multi-machine-agents](https://github.com/DELAxGithub/claude-config/blob/main/memory/multi-machine-agents.md))。旧・両機同期だが Mac Studio 引退で単機化。自動同期 (Syncthing / memory-sync.sh / `/sync*`) は 2026-05-09 全廃
- 新ツール install と同時に本リポの宣言ファイルも更新する規律あり ([claude-config memory: feedback_dev_env_drift_2026-05-10](https://github.com/DELAxGithub/claude-config/blob/main/memory/feedback_dev_env_drift_2026-05-10.md))
- commit author は `Hiroshi Kodera <h.kodera@gmail.com>` で統一 (本リポの `dotfiles/gitconfig` 参照)
