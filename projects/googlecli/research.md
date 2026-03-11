# Google Workspace CLI (`gws`) 調査メモ

URL: https://github.com/googleworkspace/cli.git

## 概要
Google Workspace の各種サービス（Drive, Gmail, Calendar, Sheets, Docs, Chat, Admin など）をターミナルから直接操作・管理できる公式のコマンドラインツール（CLI）。

## 主な特徴
1. **APIの統合アクセス**: 1つのコマンド `gws` で多岐にわたるGoogle Workspace APIを叩ける。
2. **直感的な操作性**: `--help` でAPIの仕様を確認でき、`--dry-run` で事前テストが可能。レスポンスのページネーションにも対応。
3. **AIエージェント親和性**: 構造化されたJSONレスポンスを返し、様々な操作をAIエージェント（LLM）に自律的に行わせるための100以上のスキル（`SKILL.md`）が標準同梱されている。Gemini CLIの拡張機能もサポート。

---

## 導入方法 (共通手順)

1. **CLIのインストール**
   Node.js (18以上) 環境で以下を実行します。
   ```bash
   npm install -g @googleworkspace/cli
   ```
2. **認証のセットアップ**
   ```bash
   gws auth setup
   ```
   > 画面の指示に従い、Google Cloud Consoleでのプロジェクト設定とOAuth同意画面などの設定を行います。

---

## チーム/プロジェクト別 活用ユースケース

### 1. 経理・データ連携チーム (DELAX予算管理 / mf-sheets-sync)
**【課題】** 現在、MFクラウドからのデータをGoogleスプレッドシートに反映するために、GASスクリプトを書いて `clasp` などでデプロイしている場合、GASのデプロイ手間や実行時間制限（6分ルール）などの制約があります。
**【GWS活用案】**
ローカルやCI環境のTypeScriptスクリプト（`mapper.ts`等）から、ターミナルコマンド経由で直接シートを操作します。
*   **使用例**: 
    ```bash
    gws sheets spreadsheets values append --spreadsheetId <ID> --range "Sheet1!A1" --json '{"values": [["Data", "123"]]}'
    ```
*   **メリット**: GAS（クラウド側のスクリプト）を一切書かずに、ローカル環境だけでスプレッドシートの読み書きが完結します。

### 2. 運用自動化チーム (platto-automation)
**【課題】** イベントカレンダーの運用において、「過去のイベントをグレーアウトする」など、カレンダーイベントの条件付きフィルタリングと一括更新の自動化。
**【GWS活用案】**
APIを介してイベント予定を直接取得・更新する専用のローカルスクリプト（Cron等）を作成します。
*   **使用例**: 
    1. `gws calendar events list` でイベント取得して状態をローカルスクリプトで判別
    2. 過去のイベントに対して色を変更:
       ```bash
       gws calendar events update --eventId <ID> --json '{"colorId": "8"}'
       ```
*   **メリット**: ZapierやMakeなどの外部SaaSに頼りきりにならず、自前のローカルのスクリプトだけで素早くカレンダーイベントの自動処理が構築できます。

### 3. バックオフィス・ファイル管理チーム (pdf小さく / ダイレクト納付 等)
**【課題】** ローカルで圧縮したパスポートPDFや、納付関連の書類などを、手動でGoogleドライブのチーム共有フォルダへアップロードしている作業。
**【GWS活用案】**
ファイル処理を行うスクリプトの最後に、1行 `gws` コマンドを追加して、指定のフォルダに自動アップロードする仕組みを作ります。
*   **使用例**: 
    ```bash
    gws drive files create --parent <フォルダID> --file ./compressed.pdf
    ```
*   **メリット**: 手元の処理が終わった瞬間にチームの共有ドライブへ自動で格納されるワークフローが組めるため、共有漏れを防ぎ完全自動化されます。

### 4. AI・自律型連携 (Headless Agent / 5ais 等)
**【課題】** プロジェクトで構築中の自律型AIエージェント（Obsidian等と連携してバックグラウンドで動くもの）に、Workspace周りの複雑な操作権限を持たせたい。
**【GWS活用案】**
MCP連携やエージェントツールとして、`gws` および本ツールに同梱されている100以上のAI Agent Skills (`SKILL.md`) を組み込みます。
*   **メリット**: 「新しいスプレッドシートを作成し、チームメンバーにGmailで共有リンクを送って」といった指示を、エージェントが裏で適切に `gws` コマンドを組み立てて実行してくれます。各API向けのプロンプトを個別に開発する必要がなくなります。
