# English Learning App - Use Cases & Test Plan

## 🎯 Core Use Cases (ユースケース)

本システムは、ユーザーが日常的に消費する英語コンテンツ（YouTube、Netflix、英語のニュース記事など）から、**「自分にとって未知で、かつ文脈がリアルな英単語」**をシームレスに抽出し、AIによる直訳と紐付けて、モバイルデバイスで間隔反復学習（SRS）を行うためのエコシステムです。

### 1. The "Low-Friction" Extraction (摩擦ゼロの単語抽出)
* **Actor:** 英語学習者（PCユーザー）
* **Scenario:** ユーザーはPCのChromeブラウザでYouTubeの英語動画、あるいは海外のニュース記事（Bloomberg等）を閲覧している。知らない英単語や、表現としてストックしておきたいフレーズに出会う。
* **Action:** 該当する英単語（またはその周辺のフレーズ）をマウスでハイライト（選択）し、キーボードショートカット `Cmd + Shift + E` を押下する。または、右クリックメニューから「Extract English Context」を選択する。
* **System Response:** 拡張機能は選択された単語と、その周辺の「文脈（フルセンテンス）」を取得。システムは画面下部に「Saved!」という非侵入型のトースト通知を表示し、ユーザーのコンテンツ視聴を妨げることなく（動画を止めることなく）、バックグラウンドでクラウドDB（Supabase）へデータを送信する。その際、Gemini APIが自動的に正確な「直訳」を生成し付与する。

### 2. The Habitual Active Recall (習慣的なアクティブリコール学習)
* **Actor:** 英語学習者（モバイルユーザー / PCユーザー）
* **Scenario:** ユーザーは通勤中やスキマ時間に、スマートフォン（またはPC）でWebアプリ（PWA）を開く。
* **Action:** 「New Cards」または「Review Cards」のキューが表示される。画面にはターゲットとなる英単語のみが大きく表示されている。ユーザーは頭の中で（あるいは口頭で）その単語の意味、および文脈での使われ方を思い出す。
* **System Response:** 画面をタップするとカードがフリップ（反転）し、「元の文脈（ターゲット単語が太字強調）」と「Geminiによる直訳」が表示される。
* **Action:** ユーザーは自己評価に基づき、カードを右（Easy/正解）または左（Again/不正解）にスワイプする。
* **System Response:** スワイプの結果に基づき、カードは画面から消え、次のカードが表示される。データはクラウドに同期され、忘却曲線に基づく次回表示タイミングが計算される（将来実装のSRSロジック用）。


---

## 🧪 Test Items (テスト項目)

システムの主要コンポーネントが要件を満たし、エンドツーエンド（E2E）で連携動作しているかを検証します。

### A. Chrome Extension (Data Extraction Layer)

| ID | Test Item (テスト項目) | Expected Result (期待される結果) | Status |
| :--- | :--- | :--- | :--- |
| **EXT-01** | **Right-Click Extraction:** 任意のWebページで英単語を選択し、右クリックメニューから抽出を実行する。 | 画面下部に青色のToast通知 (ex: `Saved: [word]`) が表示され、数秒で消えること。 | ☑️ |
| **EXT-02** | **Shortcut Extraction:** 任意のWebページで英単語を選択し、`Cmd + Shift + E` を押下する。 | 右クリック時と同様に、Toast通知が表示されバックグラウンドで処理が走ること。 | ☑️ |
| **EXT-03** | **Context Capturing:** 長い段落の中にある1つの単語を選択して抽出を実行する。 | 選択した単語だけでなく、その単語が含まれる親要素の文章構造（Context Sentence）が取得され、APIへ送信されていること。 | ☑️ |
| **EXT-04** | **YouTube Subtitle Support:** YouTubeの再生画面で、表示されている字幕（CC）のテキストを選択して抽出を実行する。 | 字幕がDOMロックされずハイライト可能であり、現在表示されている字幕のセグメントが文脈としてAPIに送られること。 | ☑️ |
| **EXT-05** | **Popup Launcher:** ブラウザツールバーの拡張機能アイコンをクリックする。 | ローカルストレージ内の古いデータではなく、PWAアプリ（Vercel）へ誘導するランチャー画面が表示され、リンククリックで正しいURLへ遷移すること。 | ☑️ |

### B. Next.js API & Gemini Integration (Translation & Storage)

| ID | Test Item (テスト項目) | Expected Result (期待される結果) | Status |
| :--- | :--- | :--- | :--- |
| **API-01** | **CORS Handling:** Chrome（`chrome-extension://...`）からVercel環境のAPI (`POST /api/cards`) へリクエストを送信する。 | CORSエラーでブロックされず、HTTP 200/201ステータスで正常に通信が通ること。 | ☑️ |
| **API-02** | **Gemini Literal Sync:** 抽象的な英語の文脈を送信する。（例：`Japan is embracing reform.` の `embracing` をターゲットとして送信）。 | Geminiによって、意訳ではなく構造がわかる「直訳（Literal Translation）」が日本語で生成され、DB保存用ペイロードに挿入されていること。また、ターゲット単語（`embracing` / `受け入れている`等）に対応する日本語が `**` で強調されていること。 | ☑️ |
| **API-03** | **Supabase Insertion:** API経由で送られたデータがSupabaseの `learning_cards` テーブルに格納されるか。 | `english_text`, `context_sentence`, `literal_translation`, `source` が欠損なくDBの新しい行としてInsertされていること。 | ☑️ |

### C. Web App (Learning & Retention Layer)

| ID | Test Item (テスト項目) | Expected Result (期待される結果) | Status |
| :--- | :--- | :--- | :--- |
| **APP-01** | **Real-time Data Fetching:** Webアプリ（`localhost` または `Vercel`）をブラウザで開く。 | Supabaseから `learning_cards` のデータが最新順（降順）で取得され、スワイプUIのデッキとして表示されること。「Loading...」状態が適切にハンドルされていること。 | ☑️ |
| **APP-02** | **Flip Interaction:** デッキの一番上にあるカードをクリックまたはタップする。 | 3Dフリップアニメーションがスムーズに再生され、裏面の「Context」と「Literal Translation」のテキストが表示されること。 | ☑️ |
| **APP-03** | **Markdown Parsing:** 裏面のコンテキストおよび翻訳テキストを確認する。 | APIで生成・保存された `**word**` のマークダウン箇所が、UI上で正しく「太字（またはブランドカラー）」でハイライト装飾され、そのままの `**` が表示されていないこと。 | ☑️ |
| **APP-04** | **Swipe Mechanics:** カードを左右にドラッグして離す。 | 物理演算（Framer Motion）に基づき、一定のしきい値を超えるとカードが画面外へフェードアウト・スライドし、次の配列データのアクティブカードが下から表示されること。 | ☑️ |
| **APP-05** | **Empty State:** すべてのカードをスワイプしきる、またはデータがまだないアカウントでアクセスする。 | 「You're all caught up! (今日のレビューは終わりです)」というクリーンな空状態（Empty State）のUIが表示されること。 | ☑️ |
| **APP-06** | **Card Deletion:** カードの表面（Front）に表示されている「ゴミ箱アイコン」をクリックする。 | UI上からカードが即座に消去され（Optimistic UI）、かつバックグラウンドのAPI (`DELETE /api/cards/[id]`) 経由でSupabaseの対象レコードが完全に削除されること。 | ☑️ |

---
**※備考:**
現在のフェーズ（MVP）において、上記テスト項目はすべて手動で疎通確認・統合テスト済みの状態です。
今後の拡張（Edge Case, Error Handling, TTS/Audio integration）の際は、このプランをベースに項目を追加します。
