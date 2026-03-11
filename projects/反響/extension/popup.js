document.addEventListener('DOMContentLoaded', () => {
    const airdateInput = document.getElementById('airdate');
    const locationInput = document.getElementById('location');
    const guestsInput = document.getElementById('guests');
    const output = document.getElementById('output');

    // Set default date
    const today = new Date();
    airdateInput.value = today.toISOString().split('T')[0];

    function getDates() {
        const start = new Date(airdateInput.value);
        start.setDate(start.getDate() - 1);
        const end = new Date(airdateInput.value);
        end.setDate(end.getDate() + 8);
        return {
            windowStart: start.toISOString().split('T')[0],
            windowEnd: end.toISOString().split('T')[0]
        };
    }

    document.getElementById('btn-search-x-recall').addEventListener('click', () => {
        const loc = locationInput.value || '';
        const guests = guestsInput.value || '';
        const { windowStart, windowEnd } = getDates();

        let query = '("プラッと" OR "#プラッと" OR "読むらじる") ';
        if (loc || guests) {
            const parts = [];
            if (loc) parts.push(`"${loc}"`);
            if (guests) parts.push(`"${guests}"`);
            query += `(${parts.join(' OR ')}) `;
        }
        query += `(NHK OR "ラジオ第1" OR らじる OR radiru) since:${windowStart} until:${windowEnd} lang:ja`;

        const url = `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
        chrome.tabs.create({ url });
    });

    document.getElementById('btn-search-x-precision').addEventListener('click', () => {
        const loc = locationInput.value || '';
        const guests = guestsInput.value || '';
        const { windowStart, windowEnd } = getDates();

        let query = '("プラッと" OR "#プラッと") ';
        if (loc || guests) {
            const parts = [];
            if (loc) parts.push(`"${loc}"`);
            if (guests) parts.push(`"${guests}"`);
            query += `(${parts.join(' OR ')}) `;
        }
        query += `(感想 OR よかった OR 面白かった OR 刺さった OR 勉強になった) since:${windowStart} until:${windowEnd} lang:ja`;

        const url = `https://twitter.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;
        chrome.tabs.create({ url });
    });

    document.getElementById('btn-search-note').addEventListener('click', () => {
        const query = 'site:note.com ("プラッと" OR "プラっと") (NHK OR らじる OR "ラジオ第1") (感想 OR 出演 OR 聴いた)';
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        chrome.tabs.create({ url });
    });

    document.getElementById('btn-extract').addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractPageData,
        }, (results) => {
            // Because we use Promise/async in the current flow, handling results correctly
            if (results && results[0] && results[0].result) {
                const data = results[0].result;

                const pad = (n) => n.toString().padStart(2, '0');
                const now = new Date();
                const capturedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
                const recordId = `${data.sourceType}-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                const airdate = airdateInput.value;
                const identifier = locationInput.value || '';
                const guestNames = guestsInput.value || '';

                // Match the spreadsheet schema columns
                const row = [
                    recordId, // record_id
                    data.sourceType, // source_type
                    airdate, // episode_airdate
                    identifier, // episode_identifier
                    guestNames, // guests
                    '', // query_id
                    data.url, // content_url
                    capturedAt, // captured_at
                    data.author, // author_handle
                    data.excerpt, // excerpt
                    '', // sentiment
                    '', // topic_tags
                    '', // actionable_note
                    '', // onair_candidate
                    ''  // privacy_flag
                ].join('\t');

                output.value = row;
            } else {
                output.value = "エラー：ページの情報を抽出できませんでした。再読み込みして何度か試すか、サポートされているページ（Xの個別ポストなど）か確認してください。";
            }
        });
    });

    document.getElementById('btn-copy').addEventListener('click', () => {
        output.select();
        navigator.clipboard.writeText(output.value).then(() => {
            const btn = document.getElementById('btn-copy');
            const originalText = btn.innerText;
            btn.innerText = "✅ コピーしました！";
            setTimeout(() => btn.innerText = originalText, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    });
});

// ---------- Content Script function injected into the page ----------
function extractPageData() {
    const url = window.location.href;
    let sourceType = 'Web';
    let author = '';
    let excerpt = '';

    try {
        if (url.includes('x.com') || url.includes('twitter.com')) {
            sourceType = 'X';
            // Look for the main tweet article in the thread
            const articles = document.querySelectorAll('article');
            if (articles.length > 0) {
                // Usually the first article is the main tweet if we navigated to a tweet page directly
                const article = articles[0];
                const textDiv = article.querySelector('[data-testid="tweetText"]');
                if (textDiv) {
                    excerpt = textDiv.innerText;
                }

                // Find the user handle (@xxxxx)
                const userDivs = article.querySelectorAll('a[role="link"]');
                for (const a of userDivs) {
                    if (a.href.includes('twitter.com/') || a.href.includes('x.com/')) {
                        const handleMatch = a.innerText.match(/@([\w_]+)/);
                        if (handleMatch) {
                            author = handleMatch[0];
                            break;
                        }
                    }
                }
            } else {
                excerpt = "【⚠️Xの個別ポストを開いてください（タイムラインや検索結果画面では本文が取得できない場合があります）】";
            }
        } else if (url.includes('note.com')) {
            sourceType = 'Web';
            const authorNode = document.querySelector('.o-noteCreatorProfile__name') || document.querySelector('.m-noteCreator__name');
            author = authorNode ? authorNode.innerText : document.title.split('-')[1] || '';

            const bodyNode = document.querySelector('.note-common-styles__textnote-body');
            if (bodyNode) {
                excerpt = bodyNode.innerText;
            } else {
                excerpt = document.title;
            }
        } else {
            sourceType = 'Web';
            excerpt = document.title;
        }

        // Clean up text
        if (excerpt) {
            excerpt = excerpt.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/\r/g, '').substring(0, 250);
        }
        if (author) author = author.trim();

        return {
            url: url.split('?')[0], // Remove tracking params from URL if any
            sourceType,
            author,
            excerpt
        };
    } catch (e) {
        return {
            url: window.location.href,
            sourceType: 'Web',
            author: 'Error',
            excerpt: e.message
        };
    }
}
