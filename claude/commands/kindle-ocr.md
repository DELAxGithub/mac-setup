PDFからテキストを抽出する（OCR / 構造化 / 雑誌モード）。

引数: $ARGUMENTS (PDFパスとオプション)

## 手順

1. 引数を解析:
   - PDFファイルパスが指定されていない場合はユーザーに確認
   - オプション: モード、ページ範囲、モデル

2. モード判定:
   - `構造化` / `structured` / `-s` → 単語テーブルJSON抽出
   - `雑誌` / `magazine` / `-g` → 縦書き・段組み対応の雑誌OCR
   - 指定なし → 標準OCR

3. 実行:
   ```bash
   cd ~/src/kindle-ocr && source .venv/bin/activate
   python kindle_ocr.py <pdf> [options]
   ```
   - `-m <model>`: モデル指定（デフォルト: gemini-3-flash-preview）
   - `-n <num>`: 処理ページ数
   - `--start <num>`: 開始ページ
   - `-s`: 構造化抽出
   - `-g`: 雑誌モード

4. RAGインデックス構築（構造化モード後のみ）:
   - ユーザーに確認してから実行
   ```bash
   python build_index.py <output.json> --reset
   ```

5. 結果サマリーを報告:
   - 処理ページ数、抽出文字数/語数
   - 出力ファイルパス

## ルール
- 大きなPDF（100ページ超）はページ範囲指定を提案する
- コスト目安: 10ページ ≈ $0.01未満
- .envにGEMINI_API_KEYが必要
- 出力ファイルはPDFと同じディレクトリに保存される
