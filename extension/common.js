var documentHeight = document.getElementById("top").offsetHeight;
document.getElementsByTagName("html")[0].style.height = documentHeight;

var tabId;
chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	tabId = tabs[0].id;
	chrome.tabs.sendMessage(tabId, { type: "init", tabId }, (response) => {
		if (response === true) {
			// // send message to background
			// chrome.runtime.sendMessage({ tabId });
		} else if (response === undefined) {
			tabId = undefined;
			allowNonValidPage();
			window.close();
			return alert("cannot run on this page");
		} else {
			window.close();
			return alert(response);
		}
	});
});

function allowNonValidPage() {
	// means this is a non-dropbox/youtube page - this is fine
	chrome.runtime.lastError;
}
