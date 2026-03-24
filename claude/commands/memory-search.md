長期記憶から過去のセッション会話を検索する。

## 使い方
`/memory-search <検索クエリ>`

## 手順

1. 以下のコマンドを実行して検索結果を取得する:

```bash
cd /Users/delaxpro/src/scratch/longtermmemory && uv run python -m sui_memory search "$ARGUMENTS" --limit 5
```

2. 検索結果を読み込み、現在の会話の文脈に関連する情報を統合してユーザーに共有する。
3. 結果がなければ「過去のセッションに関連する会話は見つかりませんでした」と伝える。
