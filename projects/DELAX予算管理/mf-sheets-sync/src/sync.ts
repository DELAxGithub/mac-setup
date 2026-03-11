import { resolve } from 'path';
import { parseMFJournalCSV } from './csv-parser.js';
import { loadMapping, loadDashboardRowMap, aggregateByDashLabel } from './mapper.js';
import { batchUpdateCells, getSheetId } from './gws.js';
import { DASHBOARD_SSID, DASHBOARD_SHEET, MONTH_TO_COL, DATA_SSID, ACTUALS_SHEET } from './config.js';

// 実績 = 青 (RGB 0,0,1)
const BLUE = { red: 0, green: 0, blue: 1 };

function colToA1(col: number): string {
  return String.fromCharCode(64 + col); // 1→A, 2→B, ...
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: tsx src/sync.ts <csv-file> [YYYY-MM]');
    process.exit(1);
  }

  const csvPath = resolve(args[0]);
  const targetMonth = args[1]; // optional override

  // 1. CSV パース
  console.log(`CSVを読み込み中: ${csvPath}`);
  const allRecords = parseMFJournalCSV(csvPath);
  console.log(`  費用レコード: ${allRecords.length} 件`);

  // 年月の一覧
  const months = [...new Set(allRecords.map(r => r.yearMonth))].sort();
  console.log(`  対象月: ${months.join(', ')}`);

  // 対象月でフィルタ（指定があれば）
  const records = targetMonth
    ? allRecords.filter(r => r.yearMonth === targetMonth)
    : allRecords;

  if (targetMonth && records.length === 0) {
    console.error(`${targetMonth} のデータが見つかりません`);
    process.exit(1);
  }

  // 2. マッピング読み込み
  console.log('マッピングを読み込み中...');
  const mapping = loadMapping();
  const rowMap = loadDashboardRowMap();

  // 3. シートIDを取得（batchUpdate用）
  const dashSheetId = getSheetId(DASHBOARD_SSID, DASHBOARD_SHEET);

  // 4. 月ごとにダッシュボードに書き込み（値＋青文字）
  const targetMonths = targetMonth ? [targetMonth] : months;

  for (const month of targetMonths) {
    const col = MONTH_TO_COL[month];
    if (!col) {
      console.log(`  ${month}: ダッシュボード対象期間外、スキップ`);
      continue;
    }

    const monthRecords = records.filter(r => r.yearMonth === month);
    const { mapped, unmapped } = aggregateByDashLabel(monthRecords, mapping);

    console.log(`\n--- ${month} (列${colToA1(col)}) ---`);

    // batchUpdate用のセル一覧を構築
    const cells: { row: number; col: number; value: number; fontColor: typeof BLUE }[] = [];
    for (const { dashLabel, amount } of mapped) {
      const row = rowMap[dashLabel];
      if (row) {
        cells.push({ row: row - 1, col: col - 1, value: amount, fontColor: BLUE });
        console.log(`  ✓ ${dashLabel}: ¥${amount.toLocaleString()} → ${colToA1(col)}${row}`);
      } else {
        console.log(`  ✗ "${dashLabel}" の行がダッシュボードに見つかりません`);
      }
    }

    // 一括書き込み（値＋青文字）
    if (cells.length > 0) {
      batchUpdateCells(DASHBOARD_SSID, dashSheetId, cells);
    }

    if (unmapped.length > 0) {
      console.log(`  未マッピング:`);
      for (const { mfKey, amount } of unmapped) {
        console.log(`    ? ${mfKey}: ¥${amount.toLocaleString()}`);
      }
    }

    console.log(`  → ${cells.length} 項目書き込み完了（青文字）`);
  }

  // 4. 実績シートにも書き込み（全レコード）
  console.log('\n実績シートに書き込み中...');
  const actualsRows = records.map(r => [r.yearMonth, r.account, r.sub, r.amount]);
  if (actualsRows.length > 0) {
    // ヘッダー行の次に追記
    const range = `${ACTUALS_SHEET}!A2`;
    // 既存データクリアして洗い替え（対象月分）
    for (const month of targetMonths) {
      console.log(`  ${month}: ${records.filter(r => r.yearMonth === month).length} 件`);
    }
    // appendで追記（洗い替えはGAS側の機能、ここでは追記のみ）
    const { appendValues } = require('./gws.js');
    appendValues(DATA_SSID, range, actualsRows as (string | number)[][]);
    console.log(`  → 実績シートに ${actualsRows.length} 件追記完了`);
  }

  console.log('\n完了！');
}

main();
