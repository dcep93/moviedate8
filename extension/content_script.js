var element;

// should be same as popup.js
function determineTime(state) {
	var ageMs = Date.now() - state.date;
	var secondsAdvanced = (ageMs * state.speed) / 1000;
	return state.time + secondsAdvanced;
}

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

function init(sendResponse) {
	set();
	if (element === undefined || isNaN(element.duration))
		return sendResponse("no video found");
	sendResponse(true);
}

function query(sendResponse) {
	var id = getId();
	var speed = getSpeed();
	var time = getTime();
	var date = Date.now();
	var state = { id, speed, time, date };
	sendResponse(state);
}

function set() {
	element = document.getElementsByTagName("video")[0];
}

function getId() {
	var rawId = `${window.location.host || "local"}/${element.duration}`;
	return rawId.replace(/\./g, "_");
}

function getSpeed() {
	return element.playbackRate;
}

function getTime() {
	return element.currentTime;
}

function sync(sendResponse, state) {
	if (state.speed) element.playbackRate = state.speed;
	if (state.time) element.currentTime = determineTime(state);
	sendResponse(true);
}
