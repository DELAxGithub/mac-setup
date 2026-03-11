

  Obsidian Plugin Specification:
  Instagram Post Preparer


  1. 概要
  Obsidianのノートから、Instagram投
  稿に必要な画像とテキスト（キャプシ
  ョン）をワンクリックで抽出・整理し
  、指定した場所（デスクトップ等）に
  書き出すプラグイン。

  2. 背景
  現在、Gemini
  CLIのカスタムスキルとしてスクリプ
  ト（JS）を運用しているが、これをOb
  sidianのGUI内から直接実行できるよ
  うにし、モバイル対応や設定の柔軟性
  を向上させる。

  3. 主要機能


  3.1 画像・テキストの自動抽出
   - 画像抽出:
       - アクティブなノートに含まれ
         る画像リンク（![[image.jpg]
         ] および
         ![](image.jpg)）を全て特定
         。
       - リンク先の画像ファイルをVau
         lt内から検索し、実体ファイ
         ルを収集。
   - テキスト抽出:
       - ノートの本文から画像リンク
         部分を削除したものをキャプ
         ションとして抽出。
       - YAML
         Frontmatterなどは除外するオ
         プションを設ける。


  3.2 書き出し（Export）処理
   - フォルダ作成:
       - Instagram_Post_YYYY-MM-DD_
         ノート名
         の形式でフォルダを作成。
   - ファイル保存:
       - 抽出した画像をフォルダにコ
         ピー（リネームせずにコピー
         ）。
       - 抽出したテキストを
         caption.txt として保存。
   - 保存先:
     デスクトップ、または設定で指定
     したフォルダ。


  3.3 ユーザーインターフェース (UI)
   - リボンアイコン:
     クリックで即座に実行。
   - コマンドパレット: "Instagram:
     Prepare Post from Current Note"
     コマンド。
   - 設定画面:
       - デフォルトの書き出し先パス
         の設定。
       - キャプション生成時の整形ル
         ール（ハッシュタグの自動挿
         入など）。


  4. 技術仕様
   - 言語: TypeScript
   - フレームワーク: Obsidian API
     (Node.js API利用可能)
   - 依存関係:
       - fs-extra:
         ファイル操作の簡略化。
       - path: パス操作。

  5. 実装の詳細ロジック


  A. 画像パスの解決
  Obsidianの
  app.metadataCache.getFirstLinkpath
  Dest(link, sourcePath)
  を使用して、リンク文字列から実際の
  ファイルの絶対パスを取得する。

  B. キャプションのクリーンアップ
  正規表現を使用して、Obsidian特有の
  記法（Wikiリンク、埋め込み、タグ）
  をInstagramに適した形式に置換・削
  除する。


  6. 設定項目 (Settings)

  ┌─────┬────┬─────┬──────────────┐
  │ 項目 │ 型 │ デフォ │ 説明
  │
  ├─────┼────┼─────┼──────────────┤
  │ Exp │ St │ Des │ ファイルを…  │
  │ Cre │ Bo │ Tru │ 日付付きの…  │
  │ Add │ Te │ (空) │ caption.txt… │
  │ Str │ Bo │ Tru │ `[[Note Nam… │
  └─────┴────┴─────┴──────────────┘



  7. 将来的な拡張性
   - Instagram Graph
     APIを使用した直接投稿予約機能。
   - 画像の自動リサイズ・アスペクト
     比チェック（1:1, 4:5など）。
   - 複数枚投稿（カルーセル）の順序
     指定機能。

  ---


  次のステップへのアドバイス
   1. 開発環境の構築: npx
      builtin-plugin-creator や
      Obsidianの公式サンプルリポジト
      リをクローンして開始します。
   2. 既存スクリプトの移植: 先ほどの
      prepare-for-instagram.cjs
      のロジックを、プラグインの
      main.ts
      内のコマンド実行部分に移植しま
      す。
   3. テスト:
      リンク切れの画像がある場合や、
      画像がないノートを実行した際の
      エラーハンドリングを追加します
      。


  この構成でよろしいでしょうか？必要
  に応じて、特定の機能（例：ハッシュ
  タグの自動生成など）の詳細を詰める
  ことも可能です。

  
`markdown:SKILL.md
  Obsidian to Instagram Post
  Preparer

  This skill automates the process
  of converting an Obsidian note
  into a format suitable for an
  Instagram post.

  Workflow

   1. You will be given a path to a
      markdown file in an Obsidian
      vault.
   2. Execute the
      prepare-for-instagram.cjs
      script, passing the markdown
      file path as an argument.
   3. The script will handle the
      entire process automatically.

  Script Execution

  Run the following command,
  replacing <path/to/note.md> with
  the actual file path provided by
  the user:

   1 node
     <path/to/skill-dir>/scripts/pre
     re-for-instagram.cjs
     <path/to/note.md>

    1
    2 The script will:
    3 - Create a new folder on the
      user's Desktop named
      `Instagram_Post_YYYY-MM-DD`.
    4 - Find all image links (both
      `![[...]]` and `![]()` formats
      in the note.
    5 - Copy the referenced images
      from the Obsidian vault to the
      new folder.
    6 - Extract the note's text
      content, remove the image link
      and save it as `caption.txt` i
      the new folder.
    7 - Output the path to the
      prepared folder.
    8
    9 Inform the user once the scrip
      is complete and tell them wher
      to find the folder.
   10
   11 **TODO**: The script currently
      has hardcoded paths for the
      Obsidian Vault and Desktop. In
      the future, enhance the script
      to detect these paths
      automatically or prompt the us
      for them if they can't be fou