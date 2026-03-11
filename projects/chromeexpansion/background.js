chrome.commands.onCommand.addListener((command) => {
    if (command === 'toggle_viewer') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'toggle' }, (response) => {
                    // ignore errors when not injected
                    if (chrome.runtime.lastError) console.log(chrome.runtime.lastError.message);
                });
            }
        });
    }
});
