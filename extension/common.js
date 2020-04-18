var documentHeight = document.getElementById("top").offsetHeight;
document.getElementsByTagName("html")[0].style.height = documentHeight;

var tabId;
chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	var tabId_ = tabs[0].id;

	chrome.identity.getProfileUserInfo(function (info) {
		var email = info.email + "" || "?";
		chrome.tabs.sendMessage(
			tabId_,
			{ type: "init", tabId: tabId_, email },
			(response) => {
				if (response === true) {
					tabId = tabId_;
					// // send message to background
					// chrome.runtime.sendMessage({ tabId });
				} else if (response === undefined) {
					allowNonValidPage();
					window.close();
					return alert("cannot run on this page");
				} else {
					window.close();
					return alert(response);
				}
			}
		);
	});
});

function allowNonValidPage() {
	// means this is a non-dropbox/youtube page - this is fine
	chrome.runtime.lastError;
}
