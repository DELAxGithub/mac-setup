レビューコメントCSVをDaVinci Resolveタイムラインにマーカーとして挿入するスクリプトを生成する。

## 引数
$ARGUMENTS — CSVファイルのパス（必須）

## 手順

1. 指定されたCSVを読み込み、構造を確認する（カラム名、TC形式、コメント列を特定）
2. ユーザーに以下を確認:
   - マーカーの色（デフォルト: Red）
   - TCの解釈（ビデオ先頭からの相対TC or タイムラインTC）
   - タイムライン開始TCのオフセット（デフォルト: 01:00:00:00）
3. DaVinci Resolve Scripting API を使ったPythonスクリプトを生成:
   - CSVの各行をパースしてTCをフレーム番号に変換
   - `timeline.AddMarker(frameId, color, name, note, duration)` でマーカー追加
   - 既存マーカーとの重複はスキップ
   - セミコロン（`;`）を含むドロップフレームTCに対応
   - `exec(open(...).read())` で実行されることを想定（`__file__` を使わない）
4. スクリプトをCSVと同じディレクトリに保存
5. 実行方法を案内:
   ```
   DaVinci Resolve > Workspace > Console > Py3 タブ:
   exec(open("生成したスクリプトのパス").read())
   ```

## CSV形式の想定
- Frame.io / Dropbox Replay 等のレビューツールからエクスポートされたCSV
- 最低限 コメント, タイムコード の列がある
- TC形式: `M:SS.mmm` or `H:MM:SS.mmm`

## DaVinci Resolve API メモ
- `resolve` はコンソール内で既に定義済み（外部実行時は DaVinciResolveScript で接続）
- `timeline.GetSetting("timelineFrameRate")` でFPS取得
- `timeline.GetStartTimecode()` で開始TC取得（`;` 区切りの場合あり）
- `timeline.AddMarker(frameId, color, name, note, duration)` — frameIdはタイムライン先頭からのフレーム数
- マーカー色: "Red", "Blue", "Green", "Cyan", "Yellow", "Pink", "Purple", "Fuchsia", "Rose", "Lavender", "Sky", "Mint", "Lemon", "Sand", "Cocoa", "Cream"
