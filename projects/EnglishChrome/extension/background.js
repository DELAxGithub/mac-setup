// background.js - Service Worker
console.log("English Chrome App: Background service worker initialized.");

// Setup context menu for quick extraction
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "extract-context",
        title: "Extract English Context",
        contexts: ["selection"]
    });
});

// Listen for context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "extract-context") {
        // Send message to content script to handle the extraction of the selected text
        chrome.tabs.sendMessage(tab.id, {
            type: "EXTRACT_SELECTION"
        });
    }
});

// Listen for keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command === "extract-shortcut") {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs && tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, {
                type: "EXTRACT_SELECTION"
            });
        }
    }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "SAVE_CARD") {
        console.log("Saving card to server:", request.payload);

        // Instead of local storage, send the payload to our Next.js API
        // Ensure Next.js dev server is running on localhost:3000
        fetch("http://localhost:3000/api/cards", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                englishText: request.payload.English_Text,
                contextSentence: request.payload.Context_Sentence,
                source: request.payload.Source
            })
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to save to server");
                }
                return data;
            })
            .then((data) => {
                console.log("Successfully saved card to Supabase via Next.js:", data);
                sendResponse({ success: true, card: data.data?.[0] || request.payload });
            })
            .catch((err) => {
                console.error("Network or API error saving card:", err);
                // Fallback: Notify user of failure
                sendResponse({ success: false, error: err.message });
            });

        return true; // Indicates async response
    }
});
