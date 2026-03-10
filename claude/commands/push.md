変更をgit commit & pushする。

## 手順

1. `git status` で変更ファイルを確認
2. `git diff --staged` と `git diff` で差分を確認
3. `git log --oneline -5` でコミットメッセージのスタイルを確認
4. 以下をチェック:
   - .env, credentials, secrets が含まれていないか（含まれていたら警告して除外）
   - 変更内容に対して適切なコミットメッセージを英語で作成
5. ユーザーにコミットメッセージと対象ファイルを提示して確認を取る
6. 確認後:
   - `git add` (対象ファイルを個別指定、`git add .`は使わない)
   - `git commit` (Co-Authored-By付き)
   - `git push` (現在のブランチへ)
7. push結果を報告

## ルール
- コミットメッセージは英語、簡潔に（1-2行）
- `git add .` や `git add -A` は使わない
- force pushしない
- secrets警告は必ず行う
- ユーザー確認なしにpushしない
