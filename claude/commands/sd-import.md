SDカードからSSDへ動画を安全に転送する（コピー → SHA256検証 → 削除）。

## 手順

1. SDカードが接続されているか確認:
   ```
   ls /Volumes/*/PRIVATE/M4ROOT/CLIP/*.MP4 2>/dev/null || ls /Volumes/*/DCIM/**/*.mp4 2>/dev/null
   ```
2. SSD `/Volumes/Sony_Vlog` がマウントされているか確認
3. まず `--dry-run` で対象ファイルを表示してユーザーに確認:
   ```
   python3 ~/src/scratch/SdtoSSD/sd_to_ssd.py --dest /Volumes/Sony_Vlog --verify-hash --dry-run
   ```
4. ユーザーが確認したら本番実行:
   ```
   python3 ~/src/scratch/SdtoSSD/sd_to_ssd.py --dest /Volumes/Sony_Vlog --verify-hash
   ```
5. 完了後、転送結果を報告

## ルール
- 必ず dry-run を先に見せてユーザー確認を取る
- `--verify-hash` は常に付ける（データ安全第一）
- SSDがマウントされていない場合は接続を促す
- SDカードが見つからない場合はその旨を伝える
