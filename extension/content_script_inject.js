const TIME_TO_WAIT_FOR_INJECTION = 100;
const INJECTED_ELEMENT_ID = "moviedate-injected-element";
var inject;
var injectedElement;

function handleInject(sendResponse) {
	// todo
	dateOffset = 0;
	if (inject === undefined) {
		if (window.location.host === "www.netflix.com") {
			inject = "netflix";
		} else {
			inject = null;
			sendResponse(dateOffset);
			return false;
		}
		const url = chrome.runtime.getURL(`inject_${inject}.js`);
		fetch(url)
			.then((response) => response.text())
			.then((code) => {
				var script = document.createElement("script");
				script.textContent = code;
				document.head.appendChild(script);
			})
			.then(
				() => setTimeout(() => setInjectedElement(sendResponse)),
				TIME_TO_WAIT_FOR_INJECTION
			);
		return true;
	} else {
		sendResponse(dateOffset);
	}
}

function setInjectedElement(sendResponse) {
	injectedElement = document.getElementById(INJECTED_ELEMENT_ID);
	sendResponse(dateOffset);
}
