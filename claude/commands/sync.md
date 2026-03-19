マシン間の同期を行う。引数: $ARGUMENTS (quick / push / pull / status)

## マシン判定

実行開始時に `hostname` でどのマシンか自動判定し、ヘッダーに表示する:
- `MacBook-Pro` を含む → **サブ機（MacBook Pro）** / ユーザー: `delaxpro` / 相手: `delaxstudio@delaxstudionoMac-Studio.local`
- `Mac-Studio` を含む → **メイン機（Mac Studio）** / ユーザー: `delaxstudio` / 相手: `delaxpro@DelaxPronoMacBook-Pro.local`
- それ以外 → ホスト名を表示して「不明なマシン」と警告

出力の冒頭に `📍 メイン機（Mac Studio）で実行中` のように表示する。

## モード判定

- `quick` → Quick モード（rsyncでWIPごと高速転送）
- `push` → Push モード（git commit & push、正式バックアップ）
- `pull` → Pull モード（git pull、別マシンで作業開始）
- `status` → Status モード（状態確認のみ）
- 引数なし → Status モードを実行し、ユーザーに次のアクションを提案

## Quick モード（双方向rsyncでWIP高速転送）

コミット不要でWIPのまま双方向同期する。`--delete` なし = 両マシンの和集合になる。

1. 相手マシンにSSH接続確認（LAN → Tailscale の順にフォールバック）:
   ```bash
   # まずLAN（Bonjour）を試す
   ssh -o ConnectTimeout=3 -o BatchMode=yes <相手ホスト> echo ok
   # 失敗したらTailscaleホスト名で試す
   ssh -o ConnectTimeout=3 -o BatchMode=yes <相手tailscale名> echo ok
   ```
   - Tailscaleホスト名:
     - Mac Studio: `delaxstudiomac-studio`
     - MacBook Pro: `delaxpromacbook-pro`
     - MacBook Air: `macbook-air`
   - 両方失敗: 「相手マシンに到達できません。`/sync push` でgit経由の同期をしますか？」と提案
   - SSH鍵未設定の場合: セットアップ手順を案内（後述）

2. dry-runで**双方向**の転送内容を確認:
   ```bash
   EXCLUDES="--exclude='.git' --exclude='node_modules' --exclude='.venv' \
     --exclude='__pycache__' --exclude='.DS_Store' --exclude='.env' \
     --exclude='.env.*' --exclude='*.pyc' --exclude='.next' \
     --exclude='build/' --exclude='dist/'"
   # 送信（自分→相手）
   rsync -avzn $EXCLUDES ~/src/ <相手ホスト>:~/src/
   # 受信（相手→自分）
   rsync -avzn $EXCLUDES <相手ホスト>:~/src/ ~/src/
   ```
   - 両方向の転送ファイル数をまとめて表示し、**ユーザー確認を取る**
   - `--delete` は使わない（片方にしかないファイルは残す）

3. 確認後、実際にrsync実行（dry-runの `-n` を外す、両方向）

4. Claude Codeスキルも双方向同期:
   ```bash
   rsync -avz ~/.claude/commands/ <相手ホスト>:~/.claude/commands/
   rsync -avz <相手ホスト>:~/.claude/commands/ ~/.claude/commands/
   ```

5. 完了サマリー: 送信/受信ファイル数、所要時間

### SSH初回セットアップ（必要な場合のみ案内）

```bash
# 1. 相手マシンのシステム設定 → 一般 → 共有 → リモートログインを有効化
# 2. SSH鍵をコピー
ssh-copy-id <相手ホスト>
# 3. 接続テスト
ssh <相手ホスト> echo "OK"
```

## Status モード

1. `~/src/` 配下の全 `.git` リポジトリをスキャン
2. 各リポジトリの状態を表示:
   - uncommitted changes (dirty files数)
   - unpushed commits数
   - behind remote数
3. 結果を3カテゴリに分けて表示:
   - 要push: dirty or unpushed があるリポジトリ
   - 要pull: behind があるリポジトリ
   - OK: クリーンなリポジトリ

## Push モード（git commit & push、正式バックアップ）

1. まず Status モードを実行して全体像を表示
2. dirty / unpushed なリポジトリの一覧をユーザーに提示
3. 各リポジトリについてユーザーに確認しながら:
   - `.gitignore` に `__pycache__/`, `.env`, `node_modules/`, `.DS_Store` 等が入っているかチェック
   - secrets (.env, credentials, API keys) が含まれていないか確認
   - `git add` (個別ファイル指定、`git add .` は使わない)
   - `git commit` (英語メッセージ、Co-Authored-By付き)
   - `git push`
4. **Claude Code スキル同期**: `~/.claude/commands/` → `~/src/mac-setup/claude/commands/` にコピーし、差分があれば commit & push
   - `diff -q` で差分チェック。差分がなければスキップ
   - 新規・更新ファイルのみコピー（mac-setup側にしかないファイルは削除しない）
5. 全リポジトリ完了後、MEMORY.md を最新に更新
6. 同期サマリーを表示

## Pull モード（git pull、別マシンで作業開始）

1. `~/src/` 配下の全 `.git` リポジトリで `git fetch` → `git pull`
2. **必ず実行**: `gh repo list --limit 100 --json name,isPrivate` で GitHub 上の全リポジトリを取得し、`~/src/` 配下のディレクトリ名と突合する
3. 未 clone のリポジトリがあれば一覧表示し、各リポジトリについて `git clone` するか確認する（ユーザーが「全部」と言ったらまとめて clone）
4. **Claude Code スキル復元**: `~/src/mac-setup/claude/commands/` → `~/.claude/commands/` にコピー
   - `diff -q` で差分チェック。差分がなければスキップ
   - 新規・更新されたスキルがあればコピーし、一覧を表示
5. 結果を表示:
   - Updated: pull で更新されたリポジトリ
   - Already up-to-date: 変更なし
   - **Not cloned: GitHub にあるが ~/src/ にない → clone するか確認**
   - Skills synced: コピーされたスキル一覧（あれば）
   - Conflict: コンフリクト発生（手動対応を案内）
6. MEMORY.md の内容を確認して現状報告

## ルール

- force push しない
- secrets 警告は必ず行う
- ユーザー確認なしに push/commit/rsync しない
- 日本語で出力
- エラーが出たリポジトリはスキップして続行し、最後にまとめて報告
- quick モードは `.git` を除外するため、gitの歴史は各マシン独立（clone済み前提）
