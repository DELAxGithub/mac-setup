プラッとポッドキャストの書き起こしCSV加工パイプラインを実行します。
対談の荒い書き起こし（Premiere）のタイムコードに、ソロマイクの正確な書き起こし（Whisper）のテキストを当て込み、編集用CSV → Premiere XMLを生成します。

引数: エピソード番号（例: /platto-edit 35）

## 前提
- 作業ディレクトリ: ~/src/platto-automation/
- エピソードデータ: `episodes/{EP}radio/` ディレクトリに以下が配置済み:
  - 対談CSV: `{N}_1.csv`, `{N}_2.csv`（Premiere書き起こし、カンマ区切り）
  - Whisper CSV: `NNNNN_Amic.csv`, `NNNNN_Bmic.csv` 等（セミコロン区切り）
  - テンプレートXML: `{N}_1.xml`, `{N}_2.xml`（Premiere書き出し）

## 手順

### Phase 1: ファイル確認・設定収集
1. エピソード番号を `$ARGUMENTS` から取得
2. `{EP}radio/` ディレクトリの中身を `ls` で確認
3. ファイルの存在チェック（対談CSV, Whisper CSV, テンプレートXML）
4. ユーザーに対話で確認:
   - Amic = 誰のマイク？ Bmic = 誰のマイク？
   - どのAmicファイルがPart1、どれがPart2？（Bmicも同様）
   - スタッフ名（MC等）は？
   - 色選択（デフォルト: ゲストA=Violet, ゲストB=Rose, スタッフ=Lavender）
   - A/Bマイク間のタイムオフセットはあるか？

### Phase 2: Whisperソロマイク統合
各パートごとに:
1. Amic CSV + Bmic CSV を読み込む（セミコロン区切り、`Filename;Speaker;Start Timestamp;End Timestamp;Transcript`）
2. **話者判別**: マイク装着者 = そのファイル内で最も発話量（総文字数）が多いSpeaker
   - Amicファイル内の最多話者 → Amic装着者の名前を割り当て
   - 残りのSpeakerは相手の音漏れとして扱う
   - 短い相槌（4文字以下）で相手と時間が重なるものは音漏れとして除外
3. Bmicファイルも同様に処理
4. 両方のマイクからの発話を時刻順にソート
5. 同一話者の連続発話を連結（3秒以内のギャップ）
6. タイムコードを `HH:MM:SS:FF` 形式に変換（フレーム=00）
7. 出力: `{EP}radio/output/{N}_1_whisper_merged.csv`, `{N}_2_whisper_merged.csv`
   - フォーマット: `Speaker Name,イン点,アウト点,文字起こし,色選択`

### Phase 3: 対談TC × Whisperテキスト マッチング
各パートごとに:
1. Premiere対談CSVを読み込む（`"Speaker Name","Start Time","End Time","Text"`）
2. Whisper merged CSVを読み込む
3. 対談CSVの各行のタイムコード区間に対して:
   - その時間範囲に該当するWhisperテキストを検索（±2秒の余裕）
   - マッチしたWhisperテキストで対談CSVのテキストを置換
   - 話者名をWhisper側の実名に統一
   - 色選択を話者名から自動付与
4. マッチしなかった対談CSV行: スタッフ発話の可能性 → テキストを残すか、ユーザーに確認
5. Whisper側にあって対談CSV側にない発話: 追加するか判断
6. 出力: `{EP}radio/{N}_1_edit.csv`, `{N}_2_edit.csv`

### Phase 4: クリーンアップ
既存の `clean_dialogue_031.py` のロジックを参考に:
1. エコー除去: 3秒以内の類似テキスト（similarity > 0.6）を重複排除
2. 短い相槌の除去: 他の話者の長い発話と重なる4文字以下の相槌
3. 同一話者連結: 3秒以内の連続発話をマージ
4. GAP挿入: 20秒以上の空白に `--- GAP ---` 行を挿入

### Phase 5: Premiere XML生成
既存の `convert_034radio.py` + `csvtoxml` ライブラリを使用:
```bash
cd ~/src/csvtoxml
python -c "
from csvtoxml.writers.premiere import generate_premiere_xml
generate_premiere_xml(
    csv_path='{EP}radio/{N}_1_edit.csv',
    template_xml_path='{EP}radio/{N}_1.xml',
    output_path='{EP}radio/{N}_1_editing.xml'
)
"
```
Part2も同様に実行。

### Phase 6: 結果報告
- 生成ファイル一覧
- 各ファイルの行数・総尺
- マッチング成功率（Whisperテキストが当て込めた割合）
- 問題点・警告（大きなギャップ、マッチング失敗箇所等）

## 既存コード参照
- `~/src/platto-automation/episodes/_legacy_scripts/merge_dialogue_031.py` — Whisperマージのロジック参考
- `~/src/platto-automation/episodes/_legacy_scripts/clean_dialogue_031.py` — クリーンアップのロジック参考
- `~/src/platto-automation/csvtoxml/src/csvtoxml/writers/premiere.py` — Premiere XML生成エンジン

## 注意事項
- Whisper CSVはセミコロン区切り、対談CSVはカンマ区切り（フォーマット混在に注意）
- タイムコード形式が異なる: Whisper=`MM:SS`, Premiere=`HH:MM:SS:FF`
- ワイヤレスマイクの音漏れ: 発話量ベースで主話者を判別、短い被りは除外
- 中間ファイルは `output/` サブディレクトリに保存
- 最終的な `_edit.csv` と `_editing.xml` はエピソードディレクトリ直下に出力
