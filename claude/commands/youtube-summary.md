YouTubeの動画を NotebookLM で解析し、日本語要約を保存します。

引数: $ARGUMENTS (YouTube URL)

## 手順

1. `mcp__notebooklm-mcp__notebook_create` でノートブックを作成する（title は空でOK）

2. `mcp__notebooklm-mcp__source_add` で URL をソース追加する
   - notebook_id: 上で作成したID
   - source_type: "url"
   - url: $ARGUMENTS
   - wait: true
   - ソース追加後、返ってきた title を動画タイトルとして記録する

3. `mcp__notebooklm-mcp__notebook_query` で日本語要約を取得する
   - query: "この動画の内容を日本語で詳しく要約してください。主要なポイント、紹介されているツールや手法、結論をまとめてください。"

4. 以下のフォーマットで `~/src/scratch/youtube-summary/YYYY-MM-DD_{slug}.md` に保存する
   - YYYY-MM-DD: 今日の日付
   - slug: 動画タイトルを英小文字・ハイフン区切りに変換（20文字以内）
   - 保存内容:
     ```
     # {動画タイトル}

     - **URL**: {YouTube URL}
     - **解析日**: {今日の日付}

     ## 要約

     {NotebookLM の回答をそのまま記載}
     ```

5. `mcp__notebooklm-mcp__notebook_delete` でノートブックを削除する（confirm: true）

6. 保存したファイルパスを表示して完了を報告する
