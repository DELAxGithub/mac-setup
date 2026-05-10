# mac-setup — state

User-editable notes go ABOVE the hook marker. Anything below is regenerated on session end.

<!-- HOOK_GENERATED — do not edit; regenerated on session end. Add user notes ABOVE this marker. -->

Generated: 2026-05-10T08:55:00Z
Branch: main
Last commit: d9ba65b 2026-05-10 02:30:xx +0200 feat(dotfiles): union merge claude-settings.json from MBP+Studio [skip-moderate]

## git log (last 10)

    d9ba65b (HEAD -> main, origin/main) feat(dotfiles): union merge claude-settings.json from MBP+Studio [skip-moderate]
    fdaa88e chore(env): Studio drift audit — Brewfile +5, npm +6, vscode-studio list [skip-moderate]
    af06afa chore(deps): drift audit on MBP — add 13 brew leaves + defuddle npm + 50 VSCode ext list
    cc5ffd3 feat(dotfiles): add cross-machine zshrc / gitconfig / claude-settings
    c6916b9 chore(commands): remove sync.md and sync-main.md mirrors
    4d94cbc feat(commands): add /sync-main for Studio→MBP LAN sync, advance EnglishChrome submodule [skip-moderate]
    0ed31a0 chore: mark gcp-usage skill handoff task as done
    f73e44b chore: add task — GCP usage skill & billing export handoff to Mac Studio
    1b3e489 security: decommission bicycle-research scraper and remove leaked .env
    deac35b sync: update Claude Code skills (memory-save, memory-search, platto-edit)

## Uncommitted

(clean)

## Recent devlog mentioning this project

- src/devlog/2026-04-25.md
- src/devlog/2026-05-10.md (Day 41 — multi-machine sync overhaul)

## Recent additions (2026-05-10)

新規 dir: `dotfiles/` — 両機共通の shell / git / Claude Code 設定の git 化:
- `dotfiles/gitconfig` — commit author 統一 (Hiroshi Kodera <h.kodera@gmail.com>)
- `dotfiles/zshrc` — Homebrew / mise / aliases / `claude-local` / `gswitch` 関数 (credential 部分は除外、1Password CLI で動的取得 template 注釈)
- `dotfiles/claude-settings.json` — 両機 union merge: 30 perms / 8 plugins / Studio PreToolUse hooks (pre-push-check + pre-commit-moderate) / SessionStart/End bash + timeout 10
- `dotfiles/README.md` — 適用方法 + 含まないもの (credential / machine-specific path)

drift audit:
- `Brewfile` — MBP 13 + Studio 5 = +18 件 (yt-dlp / git-filter-repo / ollama / cocoapods / fastlane / xcodes / exiftool / mpg123 / cloudflared / ddrescue / pipx / poppler / ghostscript / rclone / supabase / llama.cpp / tmux / fileicon)。syncthing / fswatch / fwupd は方針整合のため除外 (両機 brew uninstall 済)
- `npm-global-packages.txt` — +defuddle-cli / wrangler / @modelcontextprotocol/server-puppeteer / @musistudio/claude-code-router / @qwen-code/qwen-code / @tobilu/qmd
- `vscode-extensions-mbp.txt` (50 個) + `vscode-extensions-studio.txt` (12 個 = MBP の subset) を新規作成。canonical `vscode-extensions.txt` への union merge は次回

削除:
- `claude/commands/sync.md` / `claude/commands/sync-main.md` — claude-config 側の `/sync` `/sync-main` 廃止に追従、新規マシン bootstrap で再導入されないよう mirror も消去

## TODO / FIXME

(none in repo)

## Memory pointer

両機運用方針は claude-config memory:
- `multi-machine-agents.md` — git push/pull のみ、自動同期全廃
- `feedback_dev_env_drift_2026-05-10.md` — install と宣言ファイル更新を同 commit ルール
- `feedback_machine_switch_ritual.md` — 作業前 git fetch + status + ahead/behind ritual

<!-- /HOOK_GENERATED -->
