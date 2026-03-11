// content.js - Injected into pages
console.log("English Chrome App: Content script injected.");

// ---- Google Translate API logic ----
// Please provide your own Google Translate API key here later.
// Currently leaving it empty. We will fetch it from storage in a real app or handle via backend to hide it.
let translateApiKey = ""; // Needs to be configured

// ---- Save logic ----

// Listen for messages from background (e.g., context menu clicks or keyboard shortcuts)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "EXTRACT_SELECTION") {
        const selection = window.getSelection();
        let selectedWord = request.payload ? request.payload.trim() : "";

        // If not from context menu, grab it directly from window
        if (!selectedWord && selection) {
            selectedWord = selection.toString().trim();
        }

        if (!selectedWord) return;

        // Attempt to extract the full sentence context based on the current selection range
        let fullSentence = selectedWord;

        // If we're on youtube, trying to fetch the current caption segment texts
        let youtubeContext = "";
        if (window.location.hostname.includes("youtube.com")) {
            const captionElements = document.querySelectorAll('.ytp-caption-segment');
            if (captionElements && captionElements.length > 0) {
                // Concatenate all currently visible subtitle segments
                const segments = Array.from(captionElements).map(el => el.textContent).join(' ');
                if (segments.includes(selectedWord) || segments.toLowerCase().includes(selectedWord.toLowerCase())) {
                    youtubeContext = segments;
                }
            }
        }

        if (youtubeContext) {
            fullSentence = youtubeContext;
            // Bold the target word
            const escapedWord = selectedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex
            fullSentence = fullSentence.replace(new RegExp(`(\\b${escapedWord}\\b)`, 'gi'), '**$1**');
        } else if (selection && selection.rangeCount > 0) {
            // Fallback: Basic heuristic: grab the text content of the parent element as the context
            const parentNode = selection.anchorNode.parentNode;
            if (parentNode) {
                fullSentence = parentNode.textContent;
                // Bold the target word in the sentence
                const escapedWord = selectedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                fullSentence = fullSentence.replace(new RegExp(`(\\b${escapedWord}\\b)`, 'gi'), '**$1**');
            }
        }

        console.log("Target Word:", selectedWord);
        console.log("Context Sentence:", fullSentence);

        const cardData = {
            English_Text: selectedWord,
            Context_Sentence: fullSentence,
            Literal_Translation: "[Pending Translation]", // To be implemented via api
            Source: window.location.hostname
        };

        // Send to background script to save
        chrome.runtime.sendMessage({ type: "SAVE_CARD", payload: cardData }, (response) => {
            if (response && response.success) {
                // Optional: Show a subtle temporary UI toast instead of native alert so it's less annoying
                showToast(`Saved: ${selectedWord}`);
            }
        });
    }
});

// Subtle UI Toast Notification for better UX
function showToast(message) {
    let toast = document.getElementById('english-app-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'english-app-toast';
        document.body.appendChild(toast);

        // Add styles dynamically
        const style = document.createElement('style');
        style.textContent = `
      #english-app-toast {
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(37, 99, 235, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        font-family: -apple-system, sans-serif;
        font-weight: 500;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999999;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }
      #english-app-toast.show {
        opacity: 1;
      }
    `;
        document.head.appendChild(style);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}
