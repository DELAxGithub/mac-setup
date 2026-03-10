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
4. 全リポジトリ完了後、MEMORY.md を最新に更新
5. 同期サマリーを表示

## Pull モード（別マシンで作業開始するとき）

1. `~/src/` 配下の全 `.git` リポジトリで `git pull`
2. リモートがあるが `~/src/` にないリポジトリは検出できないので、GitHub上のリポジトリ一覧 (`gh repo list`) と比較して未cloneを提示
3. 結果を表示:
   - Updated: pull で更新されたリポジトリ
   - Already up-to-date: 変更なし
   - Not cloned: GitHub にあるが ~/src/ にない（clone提案）
   - Conflict: コンフリクト発生（手動対応を案内）
4. MEMORY.md の内容を確認して現状報告

## ルール

- force push しない
- secrets 警告は必ず行う
- ユーザー確認なしに push/commit しない
- 日本語で出力
- エラーが出たリポジトリはスキップして続行し、最後にまとめて報告
