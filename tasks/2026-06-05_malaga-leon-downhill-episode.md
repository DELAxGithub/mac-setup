# マラガ・ライオン峠ダウンヒルを delax-field-archive に episode 化（euroquest 動画マップ用）
- **Status**: pending
- **Created**: 2026-06-05 MacBook Pro
- **Target**: Mac Studio
- **依頼元**: MBP / euroquest 動画ポートフォリオ（EuroVelo×自転車車載の Leaflet 地図）

## 背景
MBP(サブ機)で euroquest の動画ポートフォリオを作っている。地図に「実GPXトラック＋車載動画」を
1本だけ本物で載せたい。その素材＝マラガのライオン峠（Puerto del León 想定）ダウンヒルが、
この Mac Studio で編集済み。MBP には動画本体も GPX も来ていない。
→ Mac Studio 側で「地図に必要な最小データ」を git に乗せて push してほしい。
**動画本体(MP4)は git に乗せない**（地図は YouTube ID で足りる）。

## やること
1. `cd ~/src/90_サイドワーク/delax-field-archive && git fetch && git pull --ff-only`
2. `CLAUDE.md` / `llms.txt` / `episodes/_template/episode.yaml` を読む（命名規約・スキーマ準拠）
3. 既存 `episodes/` に Puerto del León / Leon / ライオン峠 のエピソードが無いか確認
   （あれば再利用、無ければ新規。series: DBT、ID は既存 `DBT_EPxxx` 採番に倣う）
4. Mac Studio ローカルから探す:
   - ライオン峠ダウンヒルの **元GPX**（Insta360 / Garmin / Strava 等の走行ログ・数百KB）
   - その動画が **YouTube に上がっているか**（URL/ID、無ければ「未アップ」）
   - 走行データ：距離km / 獲得標高m / 撮影日 / 峠頂上・主要カーブの通過座標
5. `episodes/<id>/` を作成:
   - `gpx/<id>.gpx` ← 元GPXをコピー（小さいので git に乗せてよい）
   - `episode.yaml`（_template 準拠・最低限）:
     - `series: DBT`
     - `geo.gpx_file` / `geo.start_coord` / `geo.end_coord` / `geo.distance_km` /
       `geo.elevation_gain_m` / `geo.location_name`（例 "Málaga – Puerto del León downhill"）/
       `geo.city: Málaga` / `geo.country: Spain` / `geo.landmarks[]`（峠頂上・主要カーブ座標）
     - `publish.youtube_id` / `publish.youtube_url` ← 上がってれば記入、無ければ空＋`publish.status: not-uploaded`
     - `archive.scout_route_id`（例 `EQ-ES-MAL-BIKE-LEON-001`、既存命名に倣う）
6. `git add → commit("feat(episode): add Málaga Puerto del León downhill (DBT) for euroquest map") → push`

## やらないこと
- MP4 本体を git に commit しない（重量物は Dropbox/delax-reports か YouTube）
- episode.yaml スキーマを勝手に作り変えない（足りなければ `publish:` ブロックだけ追加可）
- force push しない
- YouTube 未アップだった場合、勝手にアップせず「/field-publish で上げるか要判断
  （限定公開でも地図に埋め込み可）」と止めて報告に書く

## 完了条件
delax-field-archive リポに episode（`gpx/<id>.gpx` + `episode.yaml`）が commit & push 済み。
MBP は `git pull` → `episode.yaml` を読んで地図に繋ぐ。

## 結果
（done 時に記入：episode ID / gpx パス / trkpt数 / 距離・獲得標高 /
 YouTube ID(or 未アップ) / push 済みか）
