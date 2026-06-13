# mac-setup/tools/

マシン非依存の小さな CLI ツール。bootstrap 後に `~/bin/` か launchd へ install して常駐させる。

## find-tool — `~/src/` 全文インデックス CLI

「アレ作ったけどどこ？」を秒で解決する。`~/src/` 配下のリポ + memory wiki + devlog を横断全文検索する単体 Python スクリプト（stdlib のみ）。

詳細仕様: [DELAxGithub/delax-tasks#1](https://github.com/DELAxGithub/delax-tasks/issues/1)

### Install

```sh
bash ~/src/mac-setup/tools/install-find-tool.sh
# -> ~/bin/find-tool シンボリックリンク作成（~/bin は zshrc で PATH 済み）
```

### スキャン対象

`~/src/` 配下を再帰走査（`MAX_DEPTH=5`）し、以下のファイル名にマッチするものを拾う:

| kind | 対象 |
|------|------|
| `memory` | `~/.claude/projects/-Users-delaxpro-src/memory/*.md` |
| `claude` | `~/src/**/CLAUDE.md` |
| `requirements` | `~/src/**/REQUIREMENTS.md` |
| `readme` | `~/src/**/README.md` |
| `state` | `~/src/**/.claude/state/current.md` |
| `devlog` | `~/src/devlog/**/*.md` |

`_archive/`, `node_modules/`, `dist/`, `DerivedData/`, `.git/`, `test-results/`, `Pods/`, `__pycache__/`, `.venv/`, `venv/`, `.next/`, `build/` 等の dir はディレクトリ単位で枝刈り。シンボリックリンクも辿らない（ループ防止）。

### スコアリング

キーワード単位で加点（AND 一致、case + Unicode NFC 正規化）:

- ファイル名一致: +100（パス一致と排他、ファイル名側を優先）
- パス一致（親ディレクトリ名等）: +30
- frontmatter `name:` / H1 一致: +60
- frontmatter `description:` 一致: +40
- 本文行一致: +5 × min(hits, 10)

ひとつのキーワードにつき +100 と +30 は排他（basename にあれば path 加点はスキップ）。AND 一致条件は「`$HOME` 以下の相対パス or 本文」のいずれかに全キーワードが含まれること。`$HOME` より上のセグメント（`/Users` / ユーザー名）は match 表面に含めないので、 `find-tool delaxpro` のようなユーザー名検索で全件ヒットすることはない。リポ名や category dir 名（例: `70_プラッと/`）はヒットする。

スコア降順、同点はパス昇順。

### 主な使い方

```sh
# 単純キーワード（全 kind を走査）
find-tool whisper

# 複数キーワード AND 一致
find-tool platto BGM

# kind 限定（繰り返し指定で OR）
find-tool davinci --type memory --type readme

# JSON 出力（パイプライン / agent 連携用）
find-tool euroquest --format json --limit 5

# TSV 出力（grep/awk 連携用）
find-tool whisper --format tsv

# kind 一覧
find-tool --list-kinds
```

### 出力フォーマット

- `md` (default) — markdown bullet。`[title]` / kind / 相対パス + 行アンカー / score / description / ヒット行 3 件
- `json` — `[{title, kind, path, score, description, matches:[{line,text}]}]`
- `tsv` — `score\tkind\tpath\tfirst_hit_line`

### 終了コード

| code | 意味 |
|------|------|
| `0`  | 1 件以上ヒット（`--format json` は常に `0`、空 list を返す） |
| `1`  | ヒット 0 件（md / tsv のみ） |
| `2`  | usage error (キーワード未指定 等) |

### Agent / Claude Code からの呼び方

スラッシュコマンド `/find` の補強用。memory index に無いキーワードでも全文検索でカバーできる:

```sh
# Bash tool 経由で
find-tool "<keyword>" --format json --limit 5
```

JSON を pipe して agent に渡せば、ヒットを再ランキング / sub-question 化できる。

### 設計判断（issue #1 の選択肢に対して）

| 軸 | 決定 | 理由 |
|----|------|------|
| 言語 | **Python 3 stdlib** | macOS 標準で動く。`rg` は Brewfile 未登録 + Claude Code shim と衝突する。bash + grep + jq の 100 行よりロジック保守がしやすい |
| インデックス方式 | **scan-on-query** | キャッシュなし。対象ファイル < 500 で十分高速 (実測 < 1 秒) |
| 設置場所 | `mac-setup/tools/` + `~/bin/` symlink | git でバックアップ + PATH 露出を分離 |

### テスト

```sh
python3 ~/src/mac-setup/tools/tests/test_find_tool.py
# -> 5 件すべて PASS で exit 0
```

pytest を入れていれば `python3 -m pytest tools/tests/` でも可。

### 副産物・拡張案（未実装）

- memory wiki の dead `[[link]]` 検出（`memory-lint` と統合余地）
- 最終更新日でフィルタ（`--since 30d`）
- `fzf` パイプ整形プリセット
- Rust への置換（必要になったら）
