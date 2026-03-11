# マルチエージェント協調プロトコル

このファイルは Claude Code と Antigravity の両方が参照する共通ルールです。

## 作業開始時

1. 対象リポジトリで `git status` を実行
2. 未コミット変更がある場合:
   - 自分の前回の作業の残りなら → commit してから作業開始
   - 別エージェントの作業の残りなら → 触らずにユーザーに報告
3. `git log --oneline -3` で直近のコミットを確認し、別エージェントの作業状況を把握

## コミットルール

- メッセージは英語
- `Co-Authored-By` ヘッダーでエージェントを明記:
  - Claude Code: `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
  - Antigravity: コミッターが `Antigravity` であれば自動で識別可能
- secrets (.env, credentials, API keys) は絶対にコミットしない
- `git add .` は使わない（個別ファイル指定）

## ブランチルール

- 小さな変更: main 直接でOK
- 大きな変更（複数ファイル、破壊的変更）: ブランチを切る
- force push しない

## 競合回避

- 同じリポジトリで同時に作業しない（人間が制御）
- 作業完了後は必ず commit & push して状態をクリーンにする
- 中途半端な状態で放置しない

## 棲み分け

### Claude Code が得意な作業

- メイン開発（Flutter/tonton, React/handover-player, Next.js/nomameshi, Python）
- 複数ファイル横断のリファクタリング・機能追加
- git管理、デプロイ、マシン間同期
- デバッグ・調査（コードベース全体を横断して原因特定）
- UIデザイン（.penファイル）
- セッション引き継ぎ・記憶管理

### Antigravity が得意な作業

- Google系（GAS/platto-automation, Drive, Calendar, Sheets）
- 単発タスク（PDF圧縮、ファイル変換、画像処理等）
- エディタ上でのちょっとした修正
- ドキュメント・台本整形（単発）

### どちらでもOK

- ドキュメント作成
- git commit & push
- 台本整形（複数ファイルならClaude Code、単発ならAntigravity）
