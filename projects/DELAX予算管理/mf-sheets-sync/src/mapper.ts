import { DEFAULT_MAPPING, DASHBOARD_SSID, DASHBOARD_SHEET, DATA_SSID, MAPPING_SHEET } from './config.js';
import { getValues } from './gws.js';
import type { ExpenseRecord } from './csv-parser.js';

/** マッピングシートから取得（なければデフォルト） */
export function loadMapping(): Record<string, string> {
  try {
    const rows = getValues(DATA_SSID, `${MAPPING_SHEET}!A2:B100`);
    if (rows.length === 0) return DEFAULT_MAPPING;
    const map: Record<string, string> = {};
    for (const [mfKey, dashLabel] of rows) {
      const k = (mfKey ?? '').trim();
      const v = (dashLabel ?? '').trim();
      if (k && v) map[k] = v;
    }
    return Object.keys(map).length > 0 ? map : DEFAULT_MAPPING;
  } catch {
    return DEFAULT_MAPPING;
  }
}

/** ダッシュボードのB列ラベル → 行番号マップを構築 */
export function loadDashboardRowMap(): Record<string, number> {
  const colA = getValues(DASHBOARD_SSID, `${DASHBOARD_SHEET}!A1:A90`);
  const colB = getValues(DASHBOARD_SSID, `${DASHBOARD_SHEET}!B1:B90`);
  const rowMap: Record<string, number> = {};
  const maxLen = Math.max(colA.length, colB.length);
  for (let i = 0; i < maxLen; i++) {
    const a = (colA[i]?.[0] ?? '').trim();
    const b = (colB[i]?.[0] ?? '').trim();
    if (b) rowMap[b] = i + 1;
    if (a) rowMap[a] = i + 1;
  }
  return rowMap;
}

export interface AggregatedExpense {
  dashLabel: string;
  amount: number;
}

export interface MappingResult {
  mapped: AggregatedExpense[];
  unmapped: { mfKey: string; amount: number }[];
}

/** 費用レコードをダッシュボードラベルに集計 */
export function aggregateByDashLabel(
  records: ExpenseRecord[],
  mapping: Record<string, string>,
): MappingResult {
  const aggregated: Record<string, number> = {};
  const unmappedMap: Record<string, number> = {};

  for (const r of records) {
    const mfKey = r.sub ? `${r.account}/${r.sub}` : r.account;
    const dashLabel = mapping[mfKey] ?? mapping[r.account];
    if (dashLabel) {
      aggregated[dashLabel] = (aggregated[dashLabel] ?? 0) + r.amount;
    } else {
      unmappedMap[mfKey] = (unmappedMap[mfKey] ?? 0) + r.amount;
    }
  }

  return {
    mapped: Object.entries(aggregated).map(([dashLabel, amount]) => ({ dashLabel, amount })),
    unmapped: Object.entries(unmappedMap).map(([mfKey, amount]) => ({ mfKey, amount })),
  };
}
