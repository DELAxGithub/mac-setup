マシン間のタスク受け渡しを行う。引数: $ARGUMENTS (create / pick / done / list)

## 概要

`~/src/mac-setup/tasks/` にタスクファイルを置いて git push/pull で共有する。
一方のマシンで仕様を書き、もう一方で実装するワークフロー。

## モード判定

- `create` → タスク作成モード
- `pick` → タスク取得・実行モード
- `done` → タスク完了モード
- `list` → 一覧表示モード
- 引数なし → list を実行

## タスクファイル形式

ファイル名: `YYYY-MM-DD_タスク名.md`
配置先: `~/src/mac-setup/tasks/`

```markdown
# タスク名
- **Status**: pending | in-progress | done
- **Created**: YYYY-MM-DD マシン名
- **Target**: 実行するマシン（Mac Studio / MacBook Pro / どちらでも）

## やること
（具体的な手順・仕様）

## 完了条件
（何をもって完了とするか）

## 結果
（done 時に記入）
```

## create モード

1. ユーザーにタスク内容をヒアリング（何を・どのマシンで・完了条件）
2. タスクファイルを `~/src/mac-setup/tasks/` に作成（Status: pending）
3. `git add tasks/ファイル名 && git commit && git push`
4. 相手マシンで `/task pick` するよう案内

## pick モード

1. `cd ~/src/mac-setup && git pull`
2. `tasks/` 内の pending タスクを一覧表示
3. ユーザーが選んだタスクの Status を `in-progress` に更新
4. タスク内容を読んで実行開始
5. 実行中は通常の作業フロー（コード編集、テスト等）

## done モード

1. 引数でタスクファイル名を指定（なければ in-progress のものを表示）
2. Status を `done` に更新
3. 結果セクションに完了内容を記入
4. `git add && git commit && git push`
5. 相手マシンで `/sync pull` するよう案内

## list モード

1. `cd ~/src/mac-setup && git pull`
2. `tasks/` 内の全タスクを Status 別に表示:
   - 🔴 pending: 未着手
   - 🟡 in-progress: 作業中
   - 🟢 done: 完了
3. 古い done タスク（7日以上前）があれば削除を提案

## ルール

- タスクファイルは日本語でOK
- commit メッセージは英語
- Co-Authored-By 付き
- 1タスク1ファイル
- done タスクは定期的にクリーンアップ（手動 or list 時に提案）
