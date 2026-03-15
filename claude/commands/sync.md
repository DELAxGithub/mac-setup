マシン間の同期を行う。引数: $ARGUMENTS (push / pull / status)

## モード判定

- `push` → Push モード（作業機を離れるとき）
- `pull` → Pull モード（別マシンで作業開始するとき）
- `status` → Status モード（状態確認のみ）
- 引数なし → Status モードを実行し、ユーザーに次のアクションを提案

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

## Push モード（作業機を離れるとき）

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

## Pull モード（別マシンで作業開始するとき）

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
- ユーザー確認なしに push/commit しない
- 日本語で出力
- エラーが出たリポジトリはスキップして続行し、最後にまとめて報告
