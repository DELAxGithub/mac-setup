# Handy セットアップ仕様書

ローカルLLMベースの無料AI音声入力ツール「Handy」の導入手順。

## 概要

- **Handy**: OSS デスクトップ音声入力アプリ (https://handy.computer/)
- ローカル Speech-to-Text (Whisper / Parakeet) + ローカル LLM post processing
- 完全オフライン動作、API課金なし、プライバシー安全
- 参考: https://zenn.dev/myshmeh/articles/handy-free-ai-voice-input

## インストール

### 1. Handy 本体

```bash
brew install --cask handy
```

Brewfile.extras に追加済み。

### 2. Post Processing 用ローカル LLM

Ollama または LM Studio を使用。Ollama推奨（CLIで管理しやすい）。

```bash
brew install ollama
ollama pull gemma3:4b
```

## Handy 設定

### Models タブ
- **日本語**: Whisper Small をダウンロード
- **英語**: Parakeet V3 をダウンロード（精度高い）
- 左上のモデル名が選択したものになっていることを確認

### General タブ
- **Shortcut**: 好みのキーに設定（例: fn 2回押し）
- **Language**: 主に使う言語を選択

### Advanced > Experimental Features
- **Post Processing**: 有効化

### Post Process タブ
- **API Endpoint**: `http://localhost:11434/v1` (Ollama) or `http://localhost:1234/v1` (LM Studio)
- **Model**: `gemma3:4b`（または任意のローカルモデル）
- **Selected Prompt**: "Improve Transcriptions"

## 実装手順（Mac Studio で実行）

1. Brewfile.extras に `handy` と `ollama` を追加（仕様書と一緒にコミット済み）
2. `brew bundle install --file=Brewfile.extras`
3. `ollama pull gemma3:4b`
4. Handy を起動し、上記の設定を行う
5. 動作テスト: ショートカットキーで音声入力 → テキスト出力を確認

## 動作テスト用フレーズ

英語:
> Apache Kafka is used for data streaming pipelines and is now supported by major data platform services including BigQuery, Snowflake, and Databricks.

日本語:
> Claude Code と Antigravity の二つのエージェントがマルチマシン環境で協調して動作しています。

## 備考

- Mac Studio (Apple Silicon) ならローカル LLM の post processing も高速
- Aqua Voice (Brewfile.extras に既存) との併用も可能だが、Handy は無料で十分実用的
- Post processing のレイテンシは 1-2秒程度（ローカル LLM の性能依存）
