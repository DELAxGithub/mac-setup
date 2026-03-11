import { execSync } from 'child_process';

const GWS = 'gws';

function run(
  args: string[],
  params: Record<string, unknown>,
  body?: Record<string, unknown>,
): unknown {
  let cmd = `${GWS} ${args.join(' ')} --params '${JSON.stringify(params)}'`;
  if (body) {
    cmd += ` --json '${JSON.stringify(body)}'`;
  }
  const result = execSync(cmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
  return JSON.parse(result);
}

/** スプレッドシートからセル値を取得 */
export function getValues(spreadsheetId: string, range: string): string[][] {
  const res = run(['sheets', 'spreadsheets', 'values', 'get'], { spreadsheetId, range }) as {
    values?: string[][];
  };
  return res.values ?? [];
}

/** セル値を上書き */
export function updateValues(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
): void {
  run(
    ['sheets', 'spreadsheets', 'values', 'update'],
    { spreadsheetId, range, valueInputOption: 'USER_ENTERED' },
    { values },
  );
}

/** セル値を追記 */
export function appendValues(
  spreadsheetId: string,
  range: string,
  values: (string | number)[][],
): void {
  run(
    ['sheets', 'spreadsheets', 'values', 'append'],
    { spreadsheetId, range, valueInputOption: 'USER_ENTERED' },
    { values },
  );
}

/** sheetIdを取得（シート名→内部ID） */
export function getSheetId(spreadsheetId: string, sheetName: string): number {
  const res = run(
    ['sheets', 'spreadsheets', 'get'],
    { spreadsheetId, fields: 'sheets.properties' },
  ) as { sheets: { properties: { title: string; sheetId: number } }[] };
  const sheet = res.sheets.find(s => s.properties.title === sheetName);
  if (!sheet) throw new Error(`シート "${sheetName}" が見つかりません`);
  return sheet.properties.sheetId;
}

/**
 * batchUpdate でセルに値＋書式を一括設定
 * cells: [{ row (0-based), col (0-based), value, fontColor }]
 */
export function batchUpdateCells(
  spreadsheetId: string,
  sheetId: number,
  cells: { row: number; col: number; value: number; fontColor?: { red: number; green: number; blue: number } }[],
): void {
  const requests = cells.map(c => ({
    updateCells: {
      rows: [{
        values: [{
          userEnteredValue: { numberValue: c.value },
          userEnteredFormat: c.fontColor
            ? { textFormat: { foregroundColorStyle: { rgbColor: c.fontColor } } }
            : undefined,
        }],
      }],
      fields: c.fontColor
        ? 'userEnteredValue,userEnteredFormat.textFormat.foregroundColorStyle'
        : 'userEnteredValue',
      start: { sheetId, rowIndex: c.row, columnIndex: c.col },
    },
  }));
  run(
    ['sheets', 'spreadsheets', 'batchUpdate'],
    { spreadsheetId },
    { requests },
  );
}
