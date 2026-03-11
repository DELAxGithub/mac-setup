


# 中古ロードバイク監視自動化エージェント 要件定義書 (PRD)

## 1. プロジェクト概要

EU圏内（主にスペインおよび欧州全域）の中古自転車マーケットプレイスを定期的に監視し、特定の条件に合致するロードバイク（PBP 2027等の超長距離ライドに向けた機材）を自動で発見・フィルタリングしてSlackへ通知するシステムを構築する。

## 2. システム要件

### 2.1 監視対象プラットフォーム

1. **Buycycle** (欧州全域)
2. **Tuvalum** (スペイン拠点)
3. **Decathlon Segunda Vida** (スペイン・アウトレット/中古)

### 2.2 ターゲット条件（LLMによる判定基準）

* **適正サイズ基準:** 身長174cmに適合するサイズであること。
* Canyonの場合: 「S」サイズ
* 他ブランドの場合: 「52」「54」、または「M」サイズ


* **最優先ターゲット (Tier 1+):**
* ブランド: Canyon
* サイズ: Sサイズのみ
* モデル・年式: Ultimate (2023年モデル以降) または Endurace (2024年モデル以降)
* グレード: CF SLX または CFR
* キーワード: 「CP0018」や「Aerocockpit」の記載がある、または完全内装モデル。
* コンポーネント: SRAM (Force / Rival / Red eTap AXS) を最優先（輪行時のバッテリー管理やパッキングが容易なため）。
* NG条件（減点対象）: 上記の一体型調整可能ハンドル(CP0018等)以外の、ケーブルに遊びが全くない完全一体型ハンドル（輪行時の取り外しが困難なため）。
* 予算上限（SRAM優遇措置）:
  * SRAM Force eTap AXS: **4,500 EUR まで**
  * Shimano Ultegra Di2: **4,000 EUR まで**
  * SRAM Rival eTap AXS: **3,500 EUR まで**
  * Shimano 105 Di2: **3,000 EUR まで**

* **Tier 2 (対抗・コスパ枠):**
* (※現状はTier 1の検証を優先するため一時保留・または別Skillとして後日定義)



## 3. 技術スタック

* **言語:** TypeScript (Node.js)
* **スクレイピング:** Playwright
* *実装要件:* 単純なDOM解析ではなく、`page.on('response', ...)` 等を用いた **API/XHRリクエストの傍受（Network Interception）** を優先し、堅牢なJSONデータ取得を実装すること。


* **データベース:** Supabase (PostgreSQL)
* 用途: 処理済み物件のURL/ID保存による重複通知の防止。


* **AI/LLM:** Gemini API (または Claude API)
* 用途: 取得した非構造化データ（タイトル、説明文、スペック表）からのサイズ適合判定および条件合致フィルタリング。


* **CI/CD (定期実行):** GitHub Actions
* 用途: cronスケジュールによる定期実行（例: 6時間に1回）。


* **通知:** Slack Incoming Webhook

## 4. データベース設計 (Local JSON)

ユーザーの運用として「通知が来たらBuycycleのお気に入りに直接入れる」ため、本格的なデータベース維持（Supabase等）は不要となりました。
簡易的な重複通知防止策として、ローカルの `notified_urls.json` に過去通知済みのURLリストを保存するのみとします。

## 5. LLMプロンプト・出力スキーマ定義

スクレイピングで取得した物件データ（JSON文字列）をLLMに渡し、以下のJSONスキーマに従って判定結果を出力させる。

```json
// LLM Output Schema
{
  "is_target": boolean, // ターゲット条件に合致し、通知すべきか
  "reason": "string", // なぜ通知対象としたか（または外したか）の理由。サイズ適合やコンポ構成について言及すること。
  "bike_type": "endurance" | "climbing" | "aero" | "other",
  "brand": "string",
  "model": "string",
  "size": "string", // 判明したサイズ
  "components": "string", // 推測されるコンポーネント
  "price_eur": number
}

```

## 6. 開発・実装ステップ（AIエージェントへの指示）

エージェントは以下のステップで自走して実装を進めること。

1. **プロジェクト初期化:**
* `package.json` の作成、TypeScript、Playwright、Supabase Client、LLM SDK、dotenvのインストール。
* `tsconfig.json` のセットアップ。


2. **スクレイピングモジュールの実装 (Playwright):**
* 対象サイトの検索結果URLを開き、バックグラウンドで走る商品一覧取得APIのレスポンスを傍受・抽出する関数を実装。


3. **LLM評価モジュールの実装:**
* 抽出したデータをLLM APIに投げ、上記スキーマのJSONを返却させるプロンプトとパース処理を実装。


4. **Supabase連携モジュールの実装:**
* 物件URLをキーにしてDBを照会し、未存在かつ `is_target: true` の場合のみDBへINSERTする処理を実装。


5. **Slack通知モジュールの実装:**
* 対象物件の情報をフォーマットし、Slack WebhookへPOSTする処理を実装。


6. **メインフローの結合とテスト:**
* 上記モジュールを統合する `index.ts` を作成。ローカル環境で単体実行し、動作確認を行うこと。


7. **GitHub Actionsの構成:**
* `.github/workflows/scraper.yml` を作成し、Playwright環境のセットアップとcron実行の定義を行うこと。



---


7. Appendix: 対象サイトのエントリーポイントURL（AIエージェントへの指示用）
Playwrightでのデータ取得を開始する際、以下のURLを起点（page.goto() のターゲット）として使用すること。動的な検索操作（入力・クリック）は避け、直接このURLを開いて一覧データ（JSONまたはDOM）を取得すること。

7.1 Buycycle (スペイン/EU圏)
BuycycleはURLのパス自体に強力なフィルタリング機能が組み込まれているため、以下のURLを直接叩くことでノイズを極限まで減らせます。

Tier 1 (Canyon 本命枠):
ロードバイク / Canyon / Endurace & Ultimate / サイズS

Plaintext
https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/canyon/families/endurace,ultimate/frame-sizes/s
Tier 2 (他ブランド 対抗枠):
ロードバイク / Trek, Specialized, Giant / サイズ52, 54, S, M

Plaintext
https://buycycle.com/es-es/shop/main-types/bikes/types/road-gravel/categories/road/brands/trek,specialized,giant/frame-sizes/52,54,s,m
(※価格フィルタはURLに組み込むと仕様変更で壊れやすいため、取得後にLLMまたはTypeScript側で price <= 5000 または price <= 2500 の足切りを行うこと)

7.2 Tuvalum (スペイン拠点)
Tuvalumはコレクション（カテゴリ）ページに対してアクセスし、そこからデータを抽出します。

Canyon ロードバイク一覧:

Plaintext
https://tuvalum.com/collections/bicicletas-canyon-carretera
他ブランド ロードバイク一覧 (Trek, Specialized, Giant):

Plaintext
https://tuvalum.com/collections/bicicletas-trek-carretera
https://tuvalum.com/collections/bicicletas-specialized-carretera
https://tuvalum.com/collections/bicicletas-giant-carretera
7.3 Decathlon Segunda Vida (スペイン 中古・アウトレット)
【重要事項】 Decathlonの中古自転車（Segunda Vida）は、自社在庫だけでなく「Bike Ocasión」や「H&B Exclusive」といったスペインの大手中古自転車業者の在庫がマーケットプレイス形式で統合されています。ここをクロールするだけでスペイン国内の優良中古ショップの在庫も網羅できるため非常に効率的です。

ロードバイク中古一覧 (全ブランド混在):

Plaintext
https://www.decathlon.es/es/productos-segunda-mano/bicicletas-carretera-segunda-mano
(※ここはURLでの詳細な絞り込みが難しいため、一覧のタイトル・価格・リンクを取得し、LLMに「CanyonのSサイズか？」「Trekの52/54サイズか？」を丸投げして判定させること)

エージェントへの補足指示（壁打ちアドバイス）
エージェントに開発をスタートさせる際、プロンプトに以下の一言を添えると、さらに失敗が減ります。

「まずはBuycycleのTier 1のURLだけを使って、Playwrightで商品一覧の取得〜LLMでの判定〜JSON出力までの単体テストスクリプト(test.ts)を作って実行してみて。SupabaseとSlack連携はデータが取れることを確認してからでいいよ。」