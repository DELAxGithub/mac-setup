# OpenCode + DeepSeek Flash を delegate-task の worker 候補として評価
- **Status**: pending
- **Created**: 2026-10-26
- **Context**: 後回し（時間がある時）。対象は ~/src/30_experiments/delegate-task と claude-config の agent-routing。元記事: https://zenn.dev/rimon/articles/45c1fd2f015af8 （Clippings/私が5種類のコーディングエージェントを使い分ける理由.md、未仕分け）

## やること
1. `docs/PHILOSOPHY.md`（非ゴール）を先に読み、delegate-task の設計思想に反しないか確認する。
2. `opencode` を導入（現状未インストール）。DeepSeek のキー取得は本人が手動で行う（1Password 保管）。
3. 機密性の低い個人リポの小タスク1本を、OpenCode+DeepSeek Flash とローカル LLM worker の両方で回し、速度・精度・コストを比較する。
4. 採用するなら delegate-task の `docs/BACKLOG.md` に worker 候補として1行追記。agent-routing に「OpenCode は個人リポ専用（案件・顧客データ・1Password周りは対象外）」と1行追加する。
5. 記事のモデル名（gpt-6.1-sol / gemini-4-argon / DeepSeek 4.1 Flash）は未検証。実在と価格プランは導入前に公式で確認する。

## 完了条件
- 比較結果（速度・精度・コスト）が結果欄に書かれ、採用/没が決まっている。
- 採用時は BACKLOG と agent-routing への追記が済んでいる。没なら理由を1行残す。

## 結果
