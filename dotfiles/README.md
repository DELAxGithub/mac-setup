# dotfiles — 両機共通の shell / git / Claude Code 設定

Mac Studio (delaxstudio) と MacBook Pro (delaxpro) で **共通化したい設定** をここに置く。マシン固有の credential / path は含まない。

## 含まれるもの

| ファイル | 配置先 (各機) | 役割 |
|---|---|---|
| `gitconfig` | `~/.gitconfig` | git commit author (Hiroshi Kodera / h.kodera@gmail.com) |
| `zshrc` | `~/.zshrc` (新規マシン) or 既存 zshrc に merge | Homebrew / mise / aliases / `gswitch` 関数 / `claude-local` |
| `claude-settings.json` | `~/.claude/settings.json` | Claude Code permissions / hooks / enabled plugins |

## 含まれないもの (各機独自)

- App Store Connect API key (`ASC_KEY_ID` / `ASC_ISSUER_ID` / `ASC_KEY_PATH`) — 1Password CLI (`op read`) で動的取得すべき。zshrc 末尾にコメント例あり
- `.p8` / `.pem` / `.kdbx` 等の credential ファイル本体
- machine-specific path (Studio は `/Users/delaxstudio`、MBP は `/Users/delaxpro`) — `$HOME` 展開で portable に書く前提

## 新規マシンへの適用

```bash
# git config
cp ~/src/mac-setup/dotfiles/gitconfig ~/.gitconfig

# zsh
cp ~/src/mac-setup/dotfiles/zshrc ~/.zshrc
# あるいは既存 ~/.zshrc に append: cat ~/src/mac-setup/dotfiles/zshrc >> ~/.zshrc

# Claude Code settings (~/.claude が claude-config の symlink で出来てるはず)
cp ~/src/mac-setup/dotfiles/claude-settings.json ~/.claude/settings.json
```

## 既存マシンで更新を取り込む

```bash
cd ~/src/mac-setup
git pull --ff-only
diff ~/.zshrc dotfiles/zshrc                   # 差分確認
cp dotfiles/zshrc ~/.zshrc                     # 上書き or merge 判断
cp dotfiles/claude-settings.json ~/.claude/settings.json
cp dotfiles/gitconfig ~/.gitconfig
```

## 関連

- claude-config memory: `op-env-pattern.md` (1Password CLI で env 管理)
- claude-config memory: `feedback_machine_switch_ritual.md` (`gswitch` 関数)
- claude-config memory: `multi-machine-agents.md` (両機運用方針)
