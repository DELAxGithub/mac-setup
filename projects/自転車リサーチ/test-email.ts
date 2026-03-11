import { execFileSync } from 'child_process';

const RECIPIENT_EMAIL = "h.kodera@gmail.com";

function testEmail() {
    // UTF-8 Subject encoding for email headers (RFC 1342)
    const rawSubject = "[Buycycle] テスト通知: Canyon Endurace CF SLX (S)";
    const subject = `=?UTF-8?B?${Buffer.from(rawSubject).toString('base64')}?=`;

    const body = `
ターゲット条件に合致する新着物件が見つかりました！

ブランド: Canyon
モデル: Endurace CF SLX
サイズ: S
コンポ: SRAM Rival eTap AXS
価格: €3,500

理由: テストメールの送信確認です。完全ワイヤレス・内装条件をクリア。

URL: https://buycycle.com/es-es/product/test
    `.trim();

    try {
        console.log(`Sending email to ${RECIPIENT_EMAIL}...`);

        // execFileSync avoids shell escaping issues by passing array of arguments
        const args = [
            'gmail', '+send',
            '--to', RECIPIENT_EMAIL,
            '--subject', subject,
            '--body', body
        ];

        const output = execFileSync('gws', args, { encoding: 'utf-8' });
        console.log("Output:", output);
        console.log("✅ Email sent successfully.");
    } catch (error: any) {
        console.error("❌ Failed to send email:");
        console.error(error.stdout);
        console.error(error.stderr);
    }
}

testEmail();
