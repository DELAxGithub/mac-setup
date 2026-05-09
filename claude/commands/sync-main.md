メイン機（Mac Studio）からサブ機（MacBook Pro）へLAN同期する。

## 前提

- メイン機でのみ使用（`hostname` に `Mac-Studio` を含むか確認、違えば「このコマンドはメイン機専用です」と警告して終了）
- サブ機は必ず同一LANにいる

## 手順

1. SSH接続確認（LANのみ）:
   ```bash
   ssh -o ConnectTimeout=3 -o BatchMode=yes delaxpro@DelaxPronoMacBook-Pro.local echo ok
   ```
   - 失敗 → 「サブ機がLANに見つかりません。同じネットワークにいるか確認してください。」で終了
   - SSH鍵未設定の場合: `ssh-copy-id delaxpro@DelaxPronoMacBook-Pro.local` を案内

2. dry-runで**双方向**の転送内容を確認:
   ```bash
   EXCLUDES="--exclude='.git' --exclude='node_modules' --exclude='.venv' \
     --exclude='__pycache__' --exclude='.DS_Store' --exclude='*.pyc' \
     --exclude='.next' --exclude='build/' --exclude='dist/'"
   # 送信（メイン→サブ）
   rsync -avzn $EXCLUDES ~/src/ delaxpro@DelaxPronoMacBook-Pro.local:~/src/
   # 受信（サブ→メイン）
   rsync -avzn $EXCLUDES delaxpro@DelaxPronoMacBook-Pro.local:~/src/ ~/src/
   ```
   - `.env` / `.env.*` は**除外しない**（自マシン間の転送なのでOK）
   - 両方向の転送ファイル数をまとめて表示し、**ユーザー確認を取る**
   - `--delete` は使わない（両マシンの和集合になる）

3. 確認後、実際にrsync実行（dry-runの `-n` を外す、両方向）

4. Claude Codeスキルも双方向同期:
   ```bash
   rsync -avz ~/.claude/commands/ delaxpro@DelaxPronoMacBook-Pro.local:~/.claude/commands/
   rsync -avz delaxpro@DelaxPronoMacBook-Pro.local:~/.claude/commands/ ~/.claude/commands/
   ```

5. 完了サマリー: 送信/受信ファイル数、所要時間

## ルール

- ユーザー確認なしに rsync しない
- 日本語で出力
- `--delete` は使わない（和集合）
- `.git` は除外するため、gitの歴史は各マシン独立（clone済み前提）
