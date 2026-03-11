# Buycycle AI 🚲 極上バイク自動監視システム - 完遂ガイド

本プロジェクトは、欧州の中古自転車市場（Buycycle）を24時間体制で監視し、Canyonの特定高級モデル（Endurace/Ultimate 1+ Tier）をAIが自動選別してメール通知するシステムです。

Jr.エンジニアや後任者が、このシステムの仕組みを理解し、メンテナンスや拡張を行うための完全ガイドです。

---

## 1. システム構成図 (Architecture)

```mermaid
graph TD
    A[GitHub Actions / cron] --> B(Playwright Scraper)
    B --> C{notified_urls.json}
    C -- 未処理物件のみ --> D[Gemini 2.5 Flash API]
    D -- プロンプト条件で判定 --> E{is_target?}
    E -- YES! --> F[GWS CLI / Gmail]
    E -- NO --> G[Skip]
    F --> H((h.kodera@gmail.com))
    G --> I[URLを履歴に保存]
    H --> I
    I --> J[notified_urls.json を更新]
```

## 2. ディレクトリ構造
- `index.ts`: **メインプログラム**。スクレイピング、AI判定、メール送信の全機能を統合。
- `notified_urls.json`: **ステート（履歴）管理**。通知済みのURLをリスト化し、二重通知を防ぐ。
- `prd.md`: **ビジネス・要件定義書**。ターゲットの判定基準（年式、グレード、予算上限）が記載。
- `.github/workflows/scraper.yml`: **自動化設定**。GitHub Actionsで毎日定期実行するための定義。

## 3. セットアップ手順

### ローカル開発環境の構築
1. **リポジトリのクローンと依存関係のインストール**
   ```bash
   npm install
   npx playwright install --with-deps chromium
   ```

2. **Google Workspace (GWS) CLI の導入**
   メール送信に `gws` コマンドを使用します。
   ```bash
   npm install -g @googleworkspace/cli
   gws auth login  # 自身のGoogleアカウントでログイン
   ```

3. **環境変数の設定**
   `.env` ファイルを作成し、Gemini APIキーを設定。
   ```text
   GEMINI_API_KEY=your_api_key_here
   ```

### 実行方法
```bash
npx tsx index.ts
```

---

## 4. メンテナンス & 拡張ガイド

### 判定基準（ロジック）を調整したい場合
`index.ts` 内の `SYSTEM_PROMPT` 変数を書き換えてください。
- **予算を変える**: `Budgets (Hard Limits)` セクションの数値を書き換えます。
- **モデルを増やす**: `Constraints` に新しいブランドやモデルを追記します。

### 指定URLを変更したい場合
`index.ts` の `TARGET_URL` を Buycycle で絞り込みを行った後のURLに差し替えてください。

### GitHub Actions での定期実行設定
1. GitHub リポジトリの **Settings > Secrets and variables > Actions** に移動。
2. 以下の3つを登録：
   - `GEMINI_API_KEY`: Gemini APIキー
   - `GWS_CLIENT_SECRET_BASE64`: `base64 ~/.config/gws/client_secret.json` の出力結果
   - `GWS_CREDENTIALS_BASE64`: `base64 ~/.config/gws/credentials.json` の出力結果
   ※ `~/.config/gws/` のファイルは `gws auth login` 完了後に Mac 上に生成されます。

---

## 5. よくあるトラブルシューティング (FAQ)

- **Gemini API で "Quota reached" エラーが出る**
  - 現在の実装では全物件を1回で判定（Batch）していますが、物件数が極端に多いとトークン制限にかかる可能性があります。その場合は `newProducts` を 10件ずつなどに分割してループするように修正してください。
- **メールの件名が文字化けする**
  - 日本語の件名には RFC 1342 形式（Base64エンコード）が必要です。`index.ts` の `sendSummaryEmail` 内で既に対策済みですが、修正する際は `=?UTF-8?B?...?=` の形式を崩さないように注意してください。
- **Playwright が動かない**
  - Buycycle の UI が大幅に変更された場合、`document.body.innerText` で取得できるテキスト構造が変わる可能性があります。その場合は `index.ts` の `productData` 抽出ロジック（`$$eval` の部分）を修正してください。

---

## 6. プロジェクトの「薔薇色のゴール」
このシステムの最終目標は「最高の1台」を見つけることです。コードを綺麗に保つだけでなく、常に **「自分が本当に買いたい自転車か？」** という視点を Gemeni のプロンプトに反映し続けてください！🚲✨
