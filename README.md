# Mac Development Environment Setup

このディレクトリには、新しいMacBook Proで現在の開発環境を再現するための自動セットアップスクリプトが含まれています。

## 概要

このセットアップキットは以下の作業を自動化します：
1. **Homebrewのインストール**: パッケージ管理ツール
2. **アプリケーション・ツールのインストール**: `Brewfile` に基づく (VS Code, Obsidian, Arc, git, ffmpeg等)
3. **シェル環境構築**: `.zshrc` の設定、`mise` の有効化
4. **ランタイムのセットアップ**: Node.js (v24) など (`mise` 使用)
5. **Python環境**: 必要なライブラリの一括インストール (`requirements.txt`)
6. **VS Code拡張機能**: 現在使用している拡張機能の復元

## 使い方 (Installation)

1. ターミナルを開き、ソースコードを管理したいディレクトリに移動します（例: `~/src`）。
   ```bash
   mkdir -p ~/src
   cd ~/src
   ```
2. リポジトリをクローンします。
   ```bash
   git clone https://github.com/DELAxGithub/mac-setup.git
   cd mac-setup
   ```
3. スクリプトに実行権限を与えます（初回のみ）。
   ```bash
   chmod +x setup.sh
   ```
4. セットアップスクリプトを実行します。
   ```bash
   ./setup.sh
   ```
5. スクリプト完了後、ターミナルを再起動してください。

## 含まれるファイル

- **setup.sh**: メインの実行スクリプト（Dockの初期化含む）。
- **Brewfile**: インストールするアプリとCLIツールのリスト。
- **requirements.txt**: Pythonパッケージのリスト。
- **vscode-extensions.txt**: VS Code拡張機能のリスト。
- **mise-config.toml**: 言語ランタイムのバージョン指定。

## 注意点

- **Google Drive / Dropbox**: アプリはインストールされますが、ログインと同期は手動で行う必要があります。
- **VS Code Sync**: 設定同期機能を使っている場合、ログインすれば設定（Settings Sync）は自動で降ってきますが、拡張機能はこのスクリプトで明示的にインストールすることも可能です。
