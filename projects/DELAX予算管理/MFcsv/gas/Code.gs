// ==============================================================
// DELAX キャッシュフローダッシュボード - Code.gs
// データ層: Google Sheets (メインダッシュボード + 実績シート)
// ==============================================================

// ダッシュボード（既存の予算管理スプレッドシート）
const DASHBOARD_SSID  = '1Snvv3fxBwDIfeF5lK3vlLS9KaC1FZ02C4Q7riT5EJuc';
const DASHBOARD_SHEET = 'ダッシュボード';

// データ用スプレッドシート（予算・実績・マッピング）
const DATA_SSID       = '1iW-dwZVARJeQOD3TN2SguQTvPn5o8ik0KAdCagBOGtU';
const BUDGET_SHEET    = '予算';
const ACTUALS_SHEET   = '実績';
const MAPPING_SHEET   = 'マッピング';
const PLAN_SHEET      = '経費計画';

// ----------------------------------------------------------------
// 費用科目一覧（MF仕訳帳の借方勘定科目）
// ----------------------------------------------------------------
const EXPENSE_ACCOUNTS = new Set([
  '役員報酬', '給料賃金', '法定福利費', '福利厚生費',
  '旅費交通費', '接待交際費', '会議費', '新聞図書費',
  '備品・消耗品費', '通信費', '水道光熱費', '保険料',
  '租税公課', '支払手数料', '取材費', '荷造運賃',
  '広告宣伝費', '一括償却資産', '工具器具備品', '外注費',
  '地代家賃',
]);

// ----------------------------------------------------------------
// 表示名マッピング（MFキー → Web UI 表示名）
// ----------------------------------------------------------------
const DISPLAY_NAME_MAP = {
  '旅費交通費/航空券':                  '渡航費（航空券）',
  '旅費交通費/宿泊費':                  '宿泊費',
  '旅費交通費/電車代':                  '交通費（電車）',
  '旅費交通費/タクシー':                '交通費（タクシー）',
  '旅費交通費/各種交通機関（電車以外）': '交通費（その他）',
  '旅費交通費':                         '旅費交通費（その他）',
  '新聞図書費/動画配信サービス':         '新聞図書費（動画配信）',
  '新聞図書費/書籍・資料':              '新聞図書費（書籍）',
  '新聞図書費/新聞・雑誌等（web含む）': '新聞図書費（雑誌・web）',
  '新聞図書費/映画・演劇・イベント等':  '新聞図書費（イベント）',
  '会議費/国内）店内利用（10％）':       '会議費（国内）',
  '会議費/海外での利用':                '会議費（海外）',
};

// ----------------------------------------------------------------
// ダッシュボードの月列マッピング（請求書発行月）
// A列=カテゴリ, B列=項目名 の2列ラベル構成
// 月データは C列(3) から: 9月=col3, 10月=col4, ... 9月(翌年)=col15, 年度合計=col16
// ----------------------------------------------------------------
const MONTH_TO_COL = {
  '2025-09': 3,  '2025-10': 4,  '2025-11': 5,
  '2025-12': 6,  '2026-01': 7,  '2026-02': 8,
  '2026-03': 9,  '2026-04': 10, '2026-05': 11,
  '2026-06': 12, '2026-07': 13, '2026-08': 14,
  '2026-09': 15,
};
const ANNUAL_COL = 16;

// ----------------------------------------------------------------
// デフォルトのMF科目→ダッシュボード行ラベル マッピング
// マッピングシートが存在すればそちらを優先
// ----------------------------------------------------------------
const DEFAULT_MF_TO_DASHBOARD = {
  '旅費交通費/宿泊費':                  '宿泊費',
  '旅費交通費/航空券':                  '航空券',
  '旅費交通費/電車代':                  '電車代',
  '旅費交通費/タクシー':                'タクシー',
  '旅費交通費/各種交通機関（電車以外）': '各種交通機関（電車以外）',
  '旅費交通費':                         '各種交通機関（電車以外）',
  '通信費/携帯料金':                    '携帯料金',
  '通信費/SaaS系サービス':              'SaaS系サービス',
  '通信費/Google':                      'Google',
  '通信費/プロバイダー・ドメイン使用料': 'SaaS系サービス',
  '新聞図書費/動画配信サービス':         '動画配信サービス',
  '新聞図書費/書籍・資料':              '書籍・資料',
  '新聞図書費/新聞・雑誌等（web含む）': '新聞・雑誌（web含む）',
  '新聞図書費/映画・演劇・イベント等':  '映画・演劇・イベント等',
  '会議費':                             '会議費',
  '会議費/国内）店内利用（10％）':       '会議費',
  '会議費/海外での利用':                '会議費',
  '水道光熱費':                         '水道・光熱費',
  '備品・消耗品費':                     '備品・消耗品',
  '租税公課':                           '租税公課',
  '支払手数料':                         '支払手数料',
  '新聞図書費':                         '新聞図書費',
  '福利厚生費':                         '福利厚生費',
  '接待交際費':                         '接待交際費',
  '保険料':                             '保険料',
  '取材費':                             '取材費',
  '荷造運賃':                           '荷造運賃',
};

// ================================================================
// Web App エントリーポイント
// ================================================================
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('DELAX キャッシュフロー')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ================================================================
// 初回セットアップ（GASエディタから手動実行）
// ================================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(DATA_SSID);

  // ---- 予算シート ----
  let budgetSheet = ss.getSheetByName(BUDGET_SHEET);
  if (!budgetSheet) {
    budgetSheet = ss.insertSheet(BUDGET_SHEET);
    const headers = [['費目', '月予算（円）']];
    const defaults = [
      ['役員報酬',                        800000],
      ['給料賃金',                              0],
      ['法定福利費',                       230000],
      ['福利厚生費',                            0],
      ['旅費交通費/航空券',                100000],
      ['旅費交通費/宿泊費',                150000],
      ['旅費交通費/電車代',                  5000],
      ['旅費交通費/タクシー',                   0],
      ['旅費交通費/各種交通機関（電車以外）',    0],
      ['接待交際費',                            0],
      ['会議費',                            50000],
      ['新聞図書費/動画配信サービス',        13294],
      ['新聞図書費/書籍・資料',             10000],
      ['新聞図書費/新聞・雑誌等（web含む）', 25000],
      ['新聞図書費/映画・演劇・イベント等',      0],
      ['通信費',                             7000],
      ['備品・消耗品費',                   100000],
      ['水道光熱費',                        15000],
      ['支払手数料',                         5000],
      ['荷造運賃',                              0],
      ['保険料',                                0],
      ['租税公課',                              0],
      ['取材費',                                0],
      ['地代家賃',                         200000],
    ];
    budgetSheet.getRange(1, 1, 1, 2).setValues(headers);
    budgetSheet.getRange(2, 1, defaults.length, 2).setValues(defaults);
    budgetSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    budgetSheet.setColumnWidth(1, 280);
    budgetSheet.setColumnWidth(2, 150);
    console.log('予算シート作成完了');
  }

  // ---- 実績シート ----
  let actualsSheet = ss.getSheetByName(ACTUALS_SHEET);
  if (!actualsSheet) {
    actualsSheet = ss.insertSheet(ACTUALS_SHEET);
    actualsSheet.getRange(1, 1, 1, 4).setValues([['年月', '勘定科目', '補助科目', '金額（円）']]);
    actualsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    actualsSheet.setColumnWidth(1, 100);
    actualsSheet.setColumnWidth(2, 200);
    actualsSheet.setColumnWidth(3, 250);
    actualsSheet.setColumnWidth(4, 120);
    console.log('実績シート作成完了');
  }

  // ---- マッピングシート ----
  let mappingSheet = ss.getSheetByName(MAPPING_SHEET);
  if (!mappingSheet) {
    mappingSheet = ss.insertSheet(MAPPING_SHEET);
    const headers = [['MF科目キー（勘定科目/補助科目）', 'ダッシュボード行ラベル', '備考']];
    const rows = Object.entries(DEFAULT_MF_TO_DASHBOARD).map(
      ([mfKey, dashLabel]) => [mfKey, dashLabel, '']
    );
    mappingSheet.getRange(1, 1, 1, 3).setValues(headers);
    mappingSheet.getRange(2, 1, rows.length, 3).setValues(rows);
    mappingSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    mappingSheet.setColumnWidth(1, 350);
    mappingSheet.setColumnWidth(2, 250);
    mappingSheet.setColumnWidth(3, 200);
    console.log('マッピングシート作成完了');
  }

  return { success: true, message: 'シート初期化完了（予算・実績・マッピング）' };
}

// ================================================================
// ダッシュボードデータ取得（クライアントから呼ばれる）
// ================================================================
function getDashboardData(yearMonth) {
  const budgetMap   = getBudgetData();
  const actualsData = getAllActuals();

  // 利用可能な月一覧（降順）
  const months = [...new Set(actualsData.map(r => r.yearMonth))].sort().reverse();

  // 対象月（省略時は最新月）
  const targetMonth = yearMonth || (months.length > 0 ? months[0] : null);

  if (!targetMonth) {
    return {
      months: [],
      targetMonth: null,
      items: [],
      totalBudget: 0,
      totalActual: 0,
      trend: [],
      setupNeeded: months.length === 0,
    };
  }

  // 対象月の実績をキーごとに集計
  const monthActuals = actualsData.filter(r => r.yearMonth === targetMonth);
  const actualMap = {};
  for (const r of monthActuals) {
    const key = r.sub ? `${r.account}/${r.sub}` : r.account;
    actualMap[key] = (actualMap[key] || 0) + r.amount;
  }

  // 予算と実績を結合
  const allKeys = new Set([...Object.keys(budgetMap), ...Object.keys(actualMap)]);
  const items = [];
  for (const key of allKeys) {
    const budget = budgetMap[key] || 0;
    const actual = actualMap[key] || 0;
    items.push({
      name:   DISPLAY_NAME_MAP[key] || key,
      key,
      budget,
      actual,
      diff:   budget - actual,  // 正 = 予算内, 負 = 超過
    });
  }
  // 実績金額の降順でソート
  items.sort((a, b) => (b.actual || b.budget) - (a.actual || a.budget));

  const totalBudget = items.reduce((s, i) => s + i.budget, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);

  // 月次推移（昇順）
  const sortedMonths = [...months].reverse();
  const trend = buildMonthlyTrend(actualsData, sortedMonths);

  return {
    months,          // 降順（セレクター用）
    targetMonth,
    items,
    totalBudget,
    totalActual,
    totalDiff: totalBudget - totalActual,
    trend,
  };
}

// ================================================================
// CSV 取り込み（クライアントから呼ばれる）
// ================================================================
function importCSV(csvContent, yearMonth) {
  const detectedMonth = detectYearMonth(csvContent);
  const targetMonth   = yearMonth || detectedMonth;

  if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
    throw new Error('年月を特定できませんでした。形式: YYYY-MM');
  }

  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) throw new Error('CSVが空です');

  const rows    = lines.slice(1).map(parseCSVLine);
  const toWrite = [];

  for (const row of rows) {
    const debitAccount = (row[2] || '').trim();
    const debitSub     = (row[3] || '').trim();
    const debitAmount  = parseInt((row[8] || '').replace(/,/g, ''), 10) || 0;

    if (EXPENSE_ACCOUNTS.has(debitAccount) && debitAmount > 0) {
      toWrite.push([targetMonth, debitAccount, debitSub, debitAmount]);
    }
  }

  if (toWrite.length === 0) {
    throw new Error(`費用科目のデータが見つかりませんでした（${targetMonth}）`);
  }

  // 同じ年月のデータを洗い替え
  const ss    = SpreadsheetApp.openById(DATA_SSID);
  const sheet = ss.getSheetByName(ACTUALS_SHEET);
  if (!sheet) {
    throw new Error('実績シートが見つかりません。先に setupSheets() を実行してください');
  }

  const existing = sheet.getDataRange().getValues();
  const keep     = [existing[0]]; // ヘッダーは維持
  for (let i = 1; i < existing.length; i++) {
    if (String(existing[i][0]).trim() !== targetMonth) keep.push(existing[i]);
  }

  sheet.clearContents();
  sheet.getRange(1, 1, keep.length, 4).setValues(keep);
  sheet.getRange(keep.length + 1, 1, toWrite.length, 4).setValues(toWrite);

  console.log(`${targetMonth}: ${toWrite.length} 件 実績シートにインポート完了`);

  // ダッシュボードにも反映
  const dashResult = writeToDashboard(toWrite, targetMonth);

  const webData = getDashboardData(targetMonth);
  webData.dashboardResult = dashResult;
  return webData;
}

// ================================================================
// ダッシュボード書き込み
// ================================================================

/**
 * マッピングシートからMF科目→ダッシュボード行ラベルの対応を取得
 * シートがなければデフォルトを返す
 */
function getMappingFromSheet() {
  const ss = SpreadsheetApp.openById(DATA_SSID);
  const sheet = ss.getSheetByName(MAPPING_SHEET);
  if (!sheet) return DEFAULT_MF_TO_DASHBOARD;

  const data = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < data.length; i++) {
    const mfKey     = String(data[i][0] || '').trim();
    const dashLabel = String(data[i][1] || '').trim();
    if (mfKey && dashLabel) {
      map[mfKey] = dashLabel;
    }
  }
  return Object.keys(map).length > 0 ? map : DEFAULT_MF_TO_DASHBOARD;
}

/**
 * ダッシュボードシートから行ラベル→行番号のマップを構築
 * A列（またはB列）のテキストをスキャンして、経費項目の行を特定
 */
function getDashboardRowMap() {
  const ss = SpreadsheetApp.openById(DASHBOARD_SSID);
  const sheet = ss.getSheetByName(DASHBOARD_SHEET);
  if (!sheet) return {};

  const lastRow = sheet.getLastRow();
  // A列とB列を取得（項目名はA列またはB列にある）
  const colA = sheet.getRange(1, 1, lastRow, 1).getValues().map(r => String(r[0]).trim());
  const colB = sheet.getRange(1, 2, lastRow, 1).getValues().map(r => String(r[0]).trim());

  const rowMap = {};
  for (let i = 0; i < lastRow; i++) {
    const labelA = colA[i];
    const labelB = colB[i];
    // B列に項目名がある場合（インデントされた経費項目）
    if (labelB) rowMap[labelB] = i + 1;
    // A列に項目名がある場合
    if (labelA) rowMap[labelA] = i + 1;
  }
  return rowMap;
}

/**
 * CSV取り込みデータをダッシュボードの実績セルに書き込む
 * @param {Array} records - [[yearMonth, account, sub, amount], ...]
 * @param {string} targetMonth - 'YYYY-MM'
 * @returns {object} 結果サマリー
 */
function writeToDashboard(records, targetMonth) {
  const col = MONTH_TO_COL[targetMonth];
  if (!col) {
    return { success: false, message: `${targetMonth} はダッシュボードの対象期間外です` };
  }

  const ss = SpreadsheetApp.openById(DASHBOARD_SSID);
  const sheet = ss.getSheetByName(DASHBOARD_SHEET);
  if (!sheet) {
    return { success: false, message: 'ダッシュボードシートが見つかりません' };
  }

  const mapping = getMappingFromSheet();
  const rowMap  = getDashboardRowMap();

  // MF科目キーごとに集計
  const aggregated = {};
  for (const [ym, account, sub, amount] of records) {
    const mfKey = sub ? `${account}/${sub}` : account;
    // マッピングを探す（完全一致 → 勘定科目のみで再検索）
    let dashLabel = mapping[mfKey] || mapping[account];
    if (dashLabel) {
      aggregated[dashLabel] = (aggregated[dashLabel] || 0) + amount;
    }
  }

  // ダッシュボードに書き込み
  const written = [];
  const unmapped = [];
  const notFound = [];

  for (const [dashLabel, total] of Object.entries(aggregated)) {
    const row = rowMap[dashLabel];
    if (row) {
      sheet.getRange(row, col).setValue(total);
      // 実績セルの文字色を青に（ダッシュボードの規約: 実績は青）
      sheet.getRange(row, col).setFontColor('#0000FF');
      written.push({ label: dashLabel, amount: total, row, col });
    } else {
      notFound.push({ label: dashLabel, amount: total });
    }
  }

  // マッピングに存在しなかった科目を特定
  for (const [ym, account, sub, amount] of records) {
    const mfKey = sub ? `${account}/${sub}` : account;
    if (!mapping[mfKey] && !mapping[account]) {
      const existing = unmapped.find(u => u.mfKey === mfKey);
      if (existing) {
        existing.amount += amount;
      } else {
        unmapped.push({ mfKey, amount });
      }
    }
  }

  console.log(`ダッシュボード: ${written.length} 項目書き込み, ${notFound.length} 行不明, ${unmapped.length} マッピング不明`);

  return {
    success: true,
    message: `${targetMonth}: ${written.length} 項目をダッシュボードに反映`,
    written,
    notFound,
    unmapped,
  };
}

// ================================================================
// 節税ダッシュボード（Web Appから呼ばれる）
// 「利益100万で着地 → あといくら経費に使える？」を算出
// ================================================================

// 目標利益（デフォルト100万円）
const TARGET_PROFIT = 1000000;

// 法人税率（中小企業: 800万以下=15%, 超過分=23.2%）
function calcCorporateTax(profit) {
  if (profit <= 0) return 0;
  if (profit <= 8000000) return Math.round(profit * 0.15);
  return Math.round(8000000 * 0.15 + (profit - 8000000) * 0.232);
}

function getDisposableSummary() {
  const ss = SpreadsheetApp.openById(DASHBOARD_SSID);
  const sheet = ss.getSheetByName(DASHBOARD_SHEET);
  if (!sheet) return { error: 'ダッシュボードが見つかりません' };

  const rowMap = getDashboardRowMap();
  const annualCol = ANNUAL_COL;

  function readAnnual(label) {
    const row = rowMap[label];
    if (!row) return 0;
    const val = sheet.getRange(row, annualCol).getValue();
    return Number(val) || 0;
  }

  // ダッシュボードの主要数値
  const revenue       = readAnnual('売り上げ（税込）');
  const totalExpense  = readAnnual('業務経費と生活経費合計（税込）');
  const currentProfit = readAnnual('利益');
  const expenseBudget = readAnnual('経費合計');
  const grossMargin   = readAnnual('売上ー外注ー人件費');

  // 計画済み経費を取得
  const planSheet = SpreadsheetApp.openById(DATA_SSID).getSheetByName(PLAN_SHEET);
  let totalPlanned = 0;
  if (planSheet) {
    const planData = planSheet.getDataRange().getValues();
    for (let i = 1; i < planData.length; i++) {
      totalPlanned += Number(planData[i][2]) || 0;
    }
  }

  // 着地利益 vs 目標利益 → 経費余力（計画分を差し引き）
  const targetProfit = TARGET_PROFIT;
  const expenseRoom  = currentProfit - targetProfit - totalPlanned;

  // 法人税シミュレーション
  const taxAtCurrent = calcCorporateTax(currentProfit);
  const taxAtTarget  = calcCorporateTax(targetProfit);
  const taxSavings   = taxAtCurrent - taxAtTarget; // 経費を使い切ることで節税できる額

  // 残り月数（年度 10月〜9月）
  const now = new Date();
  const currentMonth = now.getFullYear() * 12 + now.getMonth();
  const fyEnd = 2026 * 12 + 8; // 2026年9月
  const monthsLeft = Math.max(1, fyEnd - currentMonth + 1);
  const monthlyAllowance = Math.round(expenseRoom / monthsLeft);

  // 経費内訳（ダッシュボードの年度合計）
  const expenseLabels = [
    '宿泊費', '航空券', '電車代', '出張手当',
    '携帯料金', 'SaaS系サービス', 'Google',
    '動画配信サービス', '書籍・資料', '新聞・雑誌（web含む）', '映画・演劇・イベント等',
    '会議費', '水道・光熱費', '備品・消耗品',
    '租税公課', '減価償却費', '支払手数料', '税理士',
    'スペイン家賃', '金沢事務所費',
    '倒産共済', '消費税', '法人税等', '法人税 2025年度',
  ];
  const expenseBreakdown = [];
  for (const label of expenseLabels) {
    const amt = readAnnual(label);
    if (amt !== 0) {
      expenseBreakdown.push({ label, amount: amt });
    }
  }

  return {
    revenue,
    totalExpense,
    currentProfit,
    grossMargin,
    expenseBudget,
    targetProfit,
    expenseRoom,
    taxAtCurrent,
    taxAtTarget,
    taxSavings,
    totalPlanned,
    monthsLeft,
    monthlyAllowance,
    expenseBreakdown,
    fyLabel: '2025年10月〜2026年9月',
  };
}

// ================================================================
// 内部ヘルパー
// ================================================================
function getBudgetData() {
  const ss    = SpreadsheetApp.openById(DATA_SSID);
  const sheet = ss.getSheetByName(BUDGET_SHEET);
  if (!sheet) return {};

  const data = sheet.getDataRange().getValues();
  const map  = {};
  for (let i = 1; i < data.length; i++) {
    const key    = String(data[i][0] || '').trim();
    const amount = Number(data[i][1]) || 0;
    if (key) map[key] = amount;
  }
  return map;
}

function getAllActuals() {
  const ss    = SpreadsheetApp.openById(DATA_SSID);
  const sheet = ss.getSheetByName(ACTUALS_SHEET);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const yearMonth = String(data[i][0] || '').trim();
    const account   = String(data[i][1] || '').trim();
    const sub       = String(data[i][2] || '').trim();
    const amount    = Number(data[i][3]) || 0;
    if (yearMonth && account && amount > 0) {
      rows.push({ yearMonth, account, sub, amount });
    }
  }
  return rows;
}

function buildMonthlyTrend(actualsData, months) {
  return months.map(m => {
    const total = actualsData
      .filter(r => r.yearMonth === m)
      .reduce((s, r) => s + r.amount, 0);
    return { month: m, total };
  });
}

function detectYearMonth(csvContent) {
  const lines = csvContent.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length < 2) return null;
  const cols = parseCSVLine(lines[1]);
  const dateStr = (cols[1] || '').trim(); // 取引日: 2025/10/01
  const match = dateStr.match(/^(\d{4})\/(\d{2})/);
  if (match) return `${match[1]}-${match[2]}`;
  return null;
}

function parseCSVLine(line) {
  const result = [];
  let current  = '';
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

// ================================================================
// 月別経費計画（Web Appから呼ばれる）
// ================================================================

/** 計画シートを初期化（なければ作成） */
function ensurePlanSheet_() {
  const ss = SpreadsheetApp.openById(DATA_SSID);
  let sheet = ss.getSheetByName(PLAN_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(PLAN_SHEET);
    sheet.getRange(1, 1, 1, 4).setValues([['年月', '項目', '金額', 'メモ']]);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    sheet.setColumnWidth(1, 100);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 120);
    sheet.setColumnWidth(4, 250);
  }
  return sheet;
}

/** 月別計画を取得 — ダッシュボードの既存経費 + 計画追加分 + 余力 */
function getMonthlyPlan() {
  const ss = SpreadsheetApp.openById(DASHBOARD_SSID);
  const dashSheet = ss.getSheetByName(DASHBOARD_SHEET);
  if (!dashSheet) return { error: 'ダッシュボードが見つかりません' };

  const rowMap = getDashboardRowMap();
  const annualCol = ANNUAL_COL;

  function readAnnual(label) {
    const row = rowMap[label];
    if (!row) return 0;
    return Number(dashSheet.getRange(row, annualCol).getValue()) || 0;
  }

  // ダッシュボードから月別の経費合計を読む
  const expenseRow = rowMap['経費合計'];
  const months = [
    '2025-09','2025-10','2025-11','2025-12',
    '2026-01','2026-02','2026-03','2026-04',
    '2026-05','2026-06','2026-07','2026-08','2026-09',
  ];

  const monthlyDash = {};
  if (expenseRow) {
    for (const m of months) {
      const col = MONTH_TO_COL[m];
      if (col) {
        monthlyDash[m] = Number(dashSheet.getRange(expenseRow, col).getValue()) || 0;
      }
    }
  }

  // 計画シートから追加予定の経費を読む
  const planSheet = ensurePlanSheet_();
  const planData = planSheet.getDataRange().getValues();
  const plans = [];
  const monthlyPlanTotal = {};
  for (let i = 1; i < planData.length; i++) {
    const ym     = String(planData[i][0] || '').trim();
    const item   = String(planData[i][1] || '').trim();
    const amount = Number(planData[i][2]) || 0;
    const memo   = String(planData[i][3] || '').trim();
    if (ym && item && amount > 0) {
      plans.push({ row: i + 1, yearMonth: ym, item, amount, memo });
      monthlyPlanTotal[ym] = (monthlyPlanTotal[ym] || 0) + amount;
    }
  }

  // 着地利益と経費余力
  const currentProfit = readAnnual('利益');
  const targetProfit  = TARGET_PROFIT;
  const totalPlanned  = plans.reduce((s, p) => s + p.amount, 0);
  const expenseRoom   = currentProfit - targetProfit - totalPlanned;

  // 月別データを組み立て
  const monthlyData = months.map(m => ({
    month: m,
    dashExpense: monthlyDash[m] || 0,         // ダッシュボード上の既存経費
    planExpense: monthlyPlanTotal[m] || 0,     // 追加計画
    total: (monthlyDash[m] || 0) + (monthlyPlanTotal[m] || 0),
  }));

  return {
    months: monthlyData,
    plans,
    currentProfit,
    targetProfit,
    totalPlanned,
    expenseRoom,       // 計画反映後の残り余力
    fyLabel: '2025年10月〜2026年9月',
  };
}

/** 計画を追加 */
function addPlanItem(yearMonth, item, amount, memo) {
  const sheet = ensurePlanSheet_();
  sheet.appendRow([yearMonth, item, Number(amount), memo || '']);
  return getMonthlyPlan();
}

/** 計画を削除（行番号指定） */
function deletePlanItem(rowNum) {
  const sheet = ensurePlanSheet_();
  sheet.deleteRow(rowNum);
  return getMonthlyPlan();
}

// ================================================================
// デバッグ: ダッシュボードの行ラベル一覧とマッピング照合
// GASエディタから手動実行して実行ログで確認
// ================================================================
function debugCheckMapping() {
  const rowMap = getDashboardRowMap();
  const mapping = getMappingFromSheet();

  console.log('=== ダッシュボードの行ラベル一覧 ===');
  const sorted = Object.entries(rowMap).sort((a, b) => a[1] - b[1]);
  for (const [label, row] of sorted) {
    console.log(`  行${row}: "${label}"`);
  }

  console.log('\n=== マッピング照合 ===');
  const dashLabels = new Set(Object.values(mapping));
  for (const dashLabel of dashLabels) {
    const found = rowMap[dashLabel];
    const status = found ? `OK (行${found})` : 'NG - 行が見つからない';
    console.log(`  "${dashLabel}" → ${status}`);
  }
}
