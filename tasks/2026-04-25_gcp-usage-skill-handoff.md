# GCP使用量スキル & Billing Export メイン機への引き継ぎ

- **Status**: pending
- **Created**: 2026-04-25 MacBook Pro
- **Target**: Mac Studio

## 背景（サブ機でやったこと）

### 1. TTS比較リサーチ — 結論「学習用なら Google一本でOK」

Fish Speech / MeloTTS / CosyVoice2 / GPT-SoVITS の4モデルをローカル実行せずに比較する方針を立てた。詳細は [`~/.claude/plans/tts-git-youtube-imperative-lake.md`](/Users/delaxstudio/.claude/plans/tts-git-youtube-imperative-lake.md)（同期されてれば）。

**判断:** 性能的には Fish Speech S2 が有力だが、現時点では**売り物にする予定なし → Google Cloud TTS の無料枠で継続**する方針。Fish の Research License やセルフホスト設定の手間を取る価値はまだない。

将来 ShadowMaster / kerokero を有料化するタイミングで再検討（その場合は CosyVoice2 / GPT-SoVITS / MeloTTS の Apache/MIT 系を選ぶ）。

### 2. GCP使用量の現状把握（2026-04-25時点）

**請求アカウント:** `010955-7D42FC-893DCB`（共通）

| サービス | プロジェクト | 4月リクエスト数 | 推定$ |
|---|---|---|---|
| Cloud TTS (Chirp 3 HD) | texttospeech-392819 | 5,138 | $0〜$50（無料枠 100万字あり） |
| Gemini API (Flash中心) | gen-lang-client-0728638538 (Orion) | 2,722 | ≈$3.4（500円/月実測） |

3月の Gemini が突出（6,366req）— morning-brief / omni-watcher の試行錯誤が原因と推定。

### 3. BigQuery Billing Export 有効化済み

- データセット作成: `delax-budget.billing_export`（US multi-region、storage ほぼ$0）
- コンソールで Standard + Detailed export を有効化（ユーザー手動操作で完了）
- **データ反映は ~24h 待ち**（2026-04-26 以降に反映予定）

### 4. `/gcp-usage` スキル作成・push 済み

claude-config リポに新規スキル追加。両機で `/gcp-usage` が使えるようにした。
- コミット: `5d57f34 feat: add gcp-usage skill for cloud cost/usage checks`
- ファイル: `commands/gcp-usage.md`

## やること（メイン機）

### 必須

1. **claude-config を pull してスキルを取り込む**
   ```bash
   cd ~/src/claude-config && git pull
   ```
   - `commands/gcp-usage.md` が入ってればOK
   - `~/.claude/commands/` は symlink なので追加作業不要

2. **`/gcp-usage` の動作確認**
   - 引数なしで叩く → 今月の全サービスのリクエスト数が出るはず
   - BigQuery export データが反映済み（明日以降）なら$表示に切り替わる

### 任意

3. **BigQuery export 反映確認（明日朝以降）**
   ```bash
   bq ls delax-budget:billing_export
   ```
   - `gcp_billing_export_v1_010955_7D42FC_893DCB` が出てればOK
   - 出てなければ [Billing Export 設定](https://console.cloud.google.com/billing/010955-7D42FC-893DCB/export/bigquery) を再確認

4. **bq コマンドのパーミッション** — `/gcp-usage` 実行で permission prompt が頻発するなら settings.json に許可ルール追加:
   ```json
   "permissions": {
     "allow": ["Bash(bq query:*)", "Bash(bq ls:*)"]
   }
   ```
   - `/update-config` か `/fewer-permission-prompts` で楽できる

## 完了条件

- [ ] `cd ~/src/claude-config && git pull` で `gcp-usage.md` が手元に来る
- [ ] `/gcp-usage` を叩いて 4月の使用量サマリが表示される
- [ ] （明日以降）BigQuery export 反映後、`/gcp-usage` が $ 表示に切り替わることを確認

## 注意

- **Fish Speech の Research License** に注意 — 実装に組み込む段階になったら LICENSE 全文確認すること
- **Cloud Billing Export** はデータが BigQuery に蓄積し続ける。ストレージ料金はほぼ$0だが、念のため半年に1回くらい状況確認
- **Gemini API の課金プロジェクト** は `gen-lang-client-0728638538` (Orion)。`delax-budget` ではないので注意

## 結果

（done時に記入）
