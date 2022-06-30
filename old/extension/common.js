var documentHeight = document.getElementById("top").offsetHeight;
document.getElementsByTagName("html")[0].style.height = documentHeight;

var tabId;
chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	var tabId_ = tabs[0].id;

	chrome.identity.getProfileUserInfo(function (info) {
		var email = `${info.email || "?"}_${tabId_}`;
		chrome.tabs.sendMessage(
			tabId_,
			{ type: "init", tabId: tabId_, email },
			(response) => {
				if (typeof response === "string") {
					window.close();
					return alert(response);
				} else if (response === undefined) {
					allowNonValidPage();
					window.close();
					return alert(
						"cannot run on this page\nIf this is a local file, be sure to enable 'Allow access to file URLs' for moviedate"
					);
				} else {
					tabId = tabId_;
					initP(response);
					// // send message to background
					// chrome.runtime.sendMessage({ tabId });
				}
			}
		);
	});
});

function allowNonValidPage() {
	chrome.runtime.lastError;
}
