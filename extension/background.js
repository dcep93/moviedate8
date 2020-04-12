var tabId;
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log(tabId, message, sender);
	if (sender.tab !== undefined) return;
	if (message.tabId !== undefined) {
		tabId = message.tabId;
	} else if (tabId === undefined) {
		sendResponse(false);
	} else {
		chrome.tabs.sendMessage(tabId, message, sendResponse);
		return true;
	}
});
