import { readFileSync } from 'fs';
import { EXPENSE_ACCOUNTS } from './config.js';

export interface ExpenseRecord {
  yearMonth: string;   // "2025-10"
  account: string;     // 借方勘定科目
  sub: string;         // 借方補助科目
  amount: number;      // 借方金額(円)
}

/** CSVの1行をパース（ダブルクォート対応） */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** 取引日から年月を検出 */
function detectYearMonth(dateStr: string): string | null {
  const match = dateStr.match(/^(\d{4})\/(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : null;
}

/** MF仕訳帳CSVをパースして費用レコードを返す */
export function parseMFJournalCSV(filePath: string): ExpenseRecord[] {
  // Shift-JIS → UTF-8 変換（macOS iconv）
  const { execSync } = require('child_process');
  const utf8Content: string = execSync(
    `iconv -f SHIFT_JIS -t UTF-8 "${filePath}"`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
  );

  const lines = utf8Content.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('CSVが空です');

  const records: ExpenseRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const dateStr = (cols[1] ?? '').trim();
    const account = (cols[2] ?? '').trim();
    const sub = (cols[3] ?? '').trim();
    const amount = parseInt((cols[8] ?? '').replace(/,/g, ''), 10) || 0;

    if (!EXPENSE_ACCOUNTS.has(account) || amount <= 0) continue;

    const yearMonth = detectYearMonth(dateStr);
    if (!yearMonth) continue;

    records.push({ yearMonth, account, sub, amount });
  }

  return records;
}
