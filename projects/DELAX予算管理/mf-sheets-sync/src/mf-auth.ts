/**
 * MF Cloud OAuth 2.0 認証フロー
 *
 * 使い方:
 *   npx tsx src/mf-auth.ts          # 初回認証（ブラウザが開く）
 *   npx tsx src/mf-auth.ts refresh   # トークンリフレッシュ
 */

import http from 'node:http';
import { URL } from 'node:url';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CLIENT_ID = '218274252782551';
const CLIENT_SECRET = 'x3xiuRGNe6dVJr9FVIP8vhgHd3PyZCAdj5r_0_H_0ASJr2b0CrQpFiFPz0fRXY6JqMLnl87pavNpAGzvjjAukA';
const REDIRECT_URI = 'http://localhost:8080/callback';
const AUTH_URL = 'https://api.biz.moneyforward.com/authorize';
const TOKEN_URL = 'https://api.biz.moneyforward.com/token';

// スコープ: 会計データ読み取り
// フォーマット: mfc/{service}/data.{permission} (請求書: mfc/invoice/data.read)
const SCOPES = 'mfc/accounting/data.read';

const TOKEN_FILE = path.join(__dirname, '..', '.mf-token.json');

interface TokenData {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  obtained_at: string;
}

/** トークンをファイルから読み込み */
export function loadToken(): TokenData | null {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
}

/** トークンをファイルに保存 */
function saveToken(data: TokenData): void {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
  console.log('✓ トークン保存:', TOKEN_FILE);
}

/** 認可コード → アクセストークン交換 */
async function exchangeCode(code: string): Promise<TokenData> {
  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`トークン取得失敗 (${res.status}): ${body}`);
  }

  const json = await res.json() as any;
  return { ...json, obtained_at: new Date().toISOString() };
}

/** リフレッシュトークンでアクセストークン更新 */
export async function refreshAccessToken(): Promise<TokenData> {
  const current = loadToken();
  if (!current?.refresh_token) {
    throw new Error('リフレッシュトークンがありません。先に認証してください: npx tsx src/mf-auth.ts');
  }

  const basicAuth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: current.refresh_token,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`トークンリフレッシュ失敗 (${res.status}): ${body}`);
  }

  const json = await res.json() as any;
  const tokenData: TokenData = { ...json, obtained_at: new Date().toISOString() };
  saveToken(tokenData);
  return tokenData;
}

/** 有効なアクセストークンを取得（期限切れなら自動リフレッシュ） */
export async function getAccessToken(): Promise<string> {
  const token = loadToken();
  if (!token) {
    throw new Error('トークンがありません。先に認証してください: npx tsx src/mf-auth.ts');
  }

  const elapsed = Date.now() - new Date(token.obtained_at).getTime();
  const expiresMs = (token.expires_in || 3600) * 1000;

  // 5分前にリフレッシュ
  if (elapsed > expiresMs - 300_000) {
    console.log('トークン期限切れ → リフレッシュ中...');
    const refreshed = await refreshAccessToken();
    return refreshed.access_token;
  }

  return token.access_token;
}

/** 初回OAuth認証: ローカルサーバーで認可コードを受け取る */
async function authorize(): Promise<void> {
  const authUrl = `${AUTH_URL}?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

  console.log('ブラウザで認証してください:');
  console.log(authUrl);
  console.log('');

  // macOSでブラウザを開く
  try {
    execSync(`open "${authUrl}"`);
  } catch {
    console.log('ブラウザを手動で開いてください');
  }

  // コールバック待機サーバー
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:8080`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>認証エラー</h1><p>${error}</p>`);
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          try {
            const tokenData = await exchangeCode(code);
            saveToken(tokenData);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>認証成功！</h1><p>このタブを閉じてOKです。</p>');
            console.log('✓ 認証成功！');
            console.log('  scope:', tokenData.scope);
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>トークン取得失敗</h1><pre>${e}</pre>`);
            reject(e);
          } finally {
            server.close();
            resolve();
          }
          return;
        }
      }

      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(8080, () => {
      console.log('コールバック待機中... (localhost:8080)');
    });

    // 5分タイムアウト
    setTimeout(() => {
      server.close();
      reject(new Error('認証タイムアウト（5分）'));
    }, 300_000);
  });
}

// CLI実行
const command = process.argv[2];

if (command === 'refresh') {
  refreshAccessToken()
    .then(t => console.log('✓ リフレッシュ完了。有効期限:', t.expires_in, '秒'))
    .catch(e => { console.error(e.message); process.exit(1); });
} else {
  authorize().catch(e => { console.error(e.message); process.exit(1); });
}
