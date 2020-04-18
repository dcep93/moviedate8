var email;
var peers;

var element;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log("receive", message);
	var respond = (response) =>
		console.log("send", response) || sendResponse(response);
	switch (message.type) {
		case "init":
			init(respond, message);
			break;
		case "query":
			query(respond, message);
			break;
		case "sync":
			sync(respond, message.state);
			break;
		default:
			return respond(`invalid type: ${message.type}`);
	}
});

function init(sendResponse, message) {
	element = document.getElementsByTagName("video")[0];
	if (element === undefined || isNaN(element.duration))
		return sendResponse("no video found");
	email = message.email;
	if (db === undefined) beginReporting();
	sendResponse(true);
}

function query(sendResponse) {
	sendResponse({ email, peers });
}

function sync(sendResponse, state) {
	console.log(state);
	if (state.speed) element.playbackRate = state.speed;
	if (state.time) element.currentTime = determineTime(state);
	if (state.paused !== undefined) {
		if (state.paused) {
			element.pause();
		} else {
			element.play();
		}
	}
	sendResponse(true);
}
