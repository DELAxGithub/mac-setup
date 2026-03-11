# 第2の脳：外部自律運用（Headless Agent）移行手順書

このドキュメントは、ObsidianのGUIを介さず、ターミナルやクラウド環境でAIエージェントを自律稼働させるためのセットアップガイドです。

## 1. 概要：Obsidianから「自律エージェント」へ
現在のシステムはObsidian（GUI）上で動作していますが、以下の手順により、バックグラウンドで24時間稼働するエージェントへと進化させます。

- **作業場所**: ローカルのターミナル または GitHub Actions
- **閲覧場所**: Obsidian (iPhone/Mac/iPad) 

---

## 2. ステップ1：Gitリポジトリ化（同期の基盤）

まず、このVault全体をGit管理下に置き、GitHubのプライベートリポジトリとして同期できるようにします。

1. ターミナルでVaultのルートディレクトリに移動：
   ```bash
   cd "/Users/delaxpro/Library/Mobile Documents/iCloud~md~obsidian/Documents/DELAXiobsidianicloud"
   ```
2. Gitリポジトリを初期化：
   ```bash
   git init
   git add .
   git commit -m "Initial Second Brain setup"
   ```
3. GitHubに `private` リポジトリを作成し、リモートを追加してPush：
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_BRAIN_REPO.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. ステップ2：CLIによる「ヘッドレス実行」

Obsidianを起動していなくても、ターミナルからAIを動かす方法です。

### 基本コマンド
ターミナルから直接以下のコマンドを叩くことで、AIが自律的にタスクを処理します。
```bash
# Inboxの自動整理を実行
gemini-code "/inbox-process"

# ロードマップに基づき、優先度の高いタスクを3つ連続で実行
gemini-code "/orchestrate"

# 放置されているプロジェクトを診断
gemini-code "/stale-check"
```

---

## 4. ステップ3：GitHub Actionsによる完全自動化（Layer 3）

「寝ている間にAIが動く」状態を構築します。GitHub Actionsで定期実行（cron）を設定します。

1. リポジトリの `.github/workflows/morning-sync.yml` を作成（以下は構成案）：
   ```yaml
   name: Morning Brain Sync
   on:
     schedule:
       - cron: '0 21 * * *' # 日本時間 朝6:00
   jobs:
     sync:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - name: Run Gemini CLI Agent
           run: |
             # ここにGemini CLIの実行コマンドを記述
             # 認証情報の受け渡し設定が必要
             gemini-code "/weekly-review"
         - name: Commit & Push changes
           run: |
             git config user.name "Brain Agent"
             git config user.email "agent@example.com"
             git add .
             git commit -m "AI autonomous update: $(date +'%Y-%m-%d')"
             git push
   ```

---

## 5. ステップ4：モバイルとの同期

1. **iPhone/iPadのObsidian** に `Obsidian Git` プラグインを導入します。
2. アプリ起動時に `Pull`、終了時に `Push` する設定を有効にします。
3. **結果**: 朝起きてスマホでObsidianを開くと、AIが深夜に整理した「今日の予定」や「整理されたInbox」がすでに反映されています。

---

## 6. 注意事項：ガードレールと安全性
自律運用（Headless）に移行する際は、`GEMINI.md` の **Autonomy** セクションを以下のように厳格化することを推奨します。

- `max_issues_per_chain: 3`: 一度に実行するタスクを制限し、暴走を防ぐ。
- `forbidden_actions`: ファイルの完全削除を禁止し、`99_Archives` への移動に留める。
- `git_auto_commit: true`: 変更のたびにログを残し、いつでも戻せるようにする。
