プロジェクトをデプロイする。

## 手順

1. プロジェクトの種類を判定:
   - `vercel.json` or `.vercel/` → Vercelデプロイ
   - `ios/` + `pubspec.yaml` → Flutter iOSビルド
   - `ios/App/` + `capacitor.config.ts` → Capacitor iOSビルド
   - 判定できない場合はユーザーに確認

2. **Vercelの場合**:
   - 未コミットの変更がないか確認
   - `git push` されているか確認（されていなければ `/push` を案内）
   - Vercelは自動デプロイなので、デプロイ状況を確認
   - `vercel --prod` での手動デプロイが必要ならユーザーに確認

3. **Flutter iOSの場合**:
   - `flutter build ios --release` でビルド
   - pubspec.yamlのバージョン/ビルド番号を確認（必要ならバンプ提案）
   - `xcodebuild archive` → `xcodebuild -exportArchive`
   - ExportOptions.plistの存在確認
   - ビルド成功後、`xcrun altool --upload-app` でアップロード

4. **Capacitor iOSの場合**:
   - `npm run build` (or `next build && npx cap sync`)
   - `xcodebuild archive -project` (xcworkspaceではなくxcodeproj)
   - ExportOptions.plistで書き出し
   - altoolでアップロード

5. 結果を報告

## ルール
- ビルド前に必ずバージョン番号を確認
- xcodebuildは `-project` を使う（SPM構成前提）
- アップロード前にユーザー確認を取る
