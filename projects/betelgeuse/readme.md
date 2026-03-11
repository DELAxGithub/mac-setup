# Betelgeuse

「オリオンの会議室」台本の監修コメント抽出ツール。  
Word（.docx）ファイルに付けられたレビューコメントを構造化データとして抽出し、修正作業を効率化する。

> 名前の由来：オリオン座の左肩に輝く赤い星ベテルギウス。赤入れ（校正）の星。

---

## 背景

「オリオンの会議室」は全15話の教養映像番組。各話の台本（約2200〜2400字）に対して監修者（哲学者・専門家）がWordのコメント機能でフィードバックを返す。このツールは、コメントを一覧化し、対応方針の記録まで一気通貫で行うためのもの。

## 要件

### 入力
- `.docx` ファイル（1つまたは複数）
- コメントはWordの「校閲 > 新しいコメント」機能で挿入されている

### 抽出項目

| フィールド | 内容 | 備考 |
|---|---|---|
| `id` | コメント連番 | ファイル内での出現順 |
| `author` | コメント投稿者名 | Word上の表示名 |
| `date` | コメント日時 | ISO 8601 |
| `target_text` | コメントが紐づく本文テキスト | アンカー範囲 |
| `comment_text` | コメント本文 | |
| `reply_comments` | 返信コメント（あれば） | ネスト対応 |
| `status` | 空欄（手動で埋める列） | 対応方針を後から記入する用途 |

### 出力フォーマット
以下の2形式で出力：

1. **TSV**（スプレッドシート貼り付け用）
2. **Markdown**（レビュー会議・チャット共有用）

### Markdown出力例

```markdown
## Ep01_既読スルーの哲学.docx

### #1
- **投稿者**: 岡本裕一朗
- **日時**: 2025-06-15T14:32:00
- **対象箇所**: 「ヴィトゲンシュタインは、言葉の意味とは使い方で決まると考えました」
- **コメント**: 「考えました」→「論じました」。思想の帰属をより正確に。
- **対応方針**: ___

---
```

## 技術仕様

### アプローチ
- `python-docx` ではコメント取得が不完全なため、**docxのZIPを展開してXMLを直接パース**する
- コメント本体: `word/comments.xml`
- コメントとアンカーの紐付け: `word/document.xml` 内の `w:commentRangeStart` / `w:commentRangeEnd`
- 返信: `word/commentsExtended.xml`（存在する場合）

### 依存
- Python 3.9+
- 標準ライブラリのみ（`zipfile`, `xml.etree.ElementTree`）
- 外部パッケージ不要

### CLI

```bash
# 単一ファイル
python betelgeuse.py Ep01_既読スルーの哲学.docx

# 複数ファイル（一括処理）
python betelgeuse.py Ep01_*.docx Ep02_*.docx

# 出力先指定
python betelgeuse.py Ep01_*.docx -o ./output/

# TSVのみ出力
python betelgeuse.py Ep01_*.docx --format tsv

# Markdownのみ出力
python betelgeuse.py Ep01_*.docx --format md
```

### ディレクトリ構成

```
betelgeuse/
├── README.md
├── betelgeuse.py          # メインスクリプト
├── requirements.txt       # （空でOK。標準ライブラリのみ）
└── output/                # 出力先（自動生成）
    ├── Ep01_comments.tsv
    └── Ep01_comments.md
```

## 注意事項

- **日本語テキスト**が主体。エンコーディングは UTF-8 で統一
- コメントのアンカー範囲が複数段落にまたがるケースあり（`commentRangeStart` と `commentRangeEnd` が別の `<w:p>` に存在する）
- Wordのバージョンによって `commentsExtended.xml` がない場合がある。なくてもエラーにしない
- ファイル名に日本語を含む（例: `Ep01_既読スルーの哲学.docx`）

## 運用フロー

```
監修者が.docxにコメント
        ↓
  betelgeuse で抽出
        ↓
  TSV/Markdownで一覧化
        ↓
  プロデューサーが「対応方針」列を埋める
        ↓
  台本修正 → 再監修
```

## ライセンス

内部ツール。再配布不要。