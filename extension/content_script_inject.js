const TIME_TO_WAIT_FOR_INJECTION = 100;
const INJECTED_ELEMENT_ID = "moviedate-injected-element";
var inject;
var injectedElement;

function handleInject() {
	if (inject === undefined) {
		if (window.location.host === "www.netflix.com") {
			inject = "netflix";
		} else {
			inject = null;
			return;
		}
		const url = chrome.runtime.getURL(`inject_${inject}.js`);
		return fetch(url)
			.then((response) => response.text())
			.then((code) => {
				var script = document.createElement("script");
				script.textContent = code;
				document.head.appendChild(script);
			})
			.then(setInjectedElement);
	}
}

function setInjectedElement() {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			injectedElement = document.getElementById(INJECTED_ELEMENT_ID);
			resolve();
		}),
			TIME_TO_WAIT_FOR_INJECTION;
	});
}
