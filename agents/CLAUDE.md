# ~/src/ Multi-Agent Workspace

このワークスペースでは複数のAIエージェント（Claude Code, Antigravity）が作業しています。

## エージェント共存ルール

- 作業開始前に対象リポジトリの `git status` で未コミット変更がないか確認する
- 未コミット変更がある場合、そのリポジトリでの作業は避ける（または先にcommitを提案する）
- commit メッセージには `Co-Authored-By` でエージェント名を明記する
- 各リポジトリの CLAUDE.md / AGENTS.md のルールに従う
- 大きな変更はブランチを切って作業する

## エージェント設定の場所

- Claude Code: `~/.claude/commands/` (push, sync, session-start, handover, deploy)
- Antigravity: `~/src/.agents/workflows/` (sync, wrapup)
- 共通プロトコル: `~/src/.agents/coordination.md`

## 基本方針

- 日本語でコミュニケーション、コミットメッセージは英語
- secrets (.env, credentials) は絶対にコミットしない
- force push しない
