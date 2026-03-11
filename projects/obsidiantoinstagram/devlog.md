# 開発日誌 (Dev Log)

## 2026-02-26
- **プラグイン環境構築**:
  - `package.json`, `tsconfig.json`, `esbuild.config.mjs`, `manifest.json` などのテンプレートを作成してプラグイン環境を構築。
  - `prepare-for-instagram.cjs` の処理（`fs-extra` やローカルパスに依存した処理）を Obsidian API（`app.vault.read`, `app.metadataCache.getFirstLinkpathDest`, `fs.promises`）を利用するように移植完了。
- **トラブルシューティング（プラグインの認識エラー）**:
  - **事象**: 開発ディレクトリと Obsidian の `.obsidian/plugins` フォルダ間をシンボリックリンクで繋いだが、コミュニティプラグイン一覧に表示されなかった。
  - **原因と解決法**:
    1. `manifest.json` の `id` とプラグイン配置フォルダ名が完全一致していないと読み込まれないため、フォルダ名を `obsidian-instagram-post-preparer` に修正。
    2. プラグイン配置先が iCloud Drive 用のパス（`/Users/.../Library/Mobile Documents/iCloud~md~obsidian/Documents`）であったため、シンボリックリンク（`ln -s`）では正常に認識されなかった。シンボリックリンクを解除し、`cp -r` で本体を直接配置することで解決。開発時の同期にはフォルダの直接コピースクリプトなどを利用する必要がある。
