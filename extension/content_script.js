var email;
var peers;

var element;

var syncListener;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log("receive", message.type, message);
	var respond = (response) =>
		console.log("send", response) || sendResponse(response);
	switch (message.type) {
		case "init":
			return init(respond, message);
		case "query":
			query(respond, message);
			break;
		case "set_state":
			setState(respond, message);
			break;
		case "sync":
			sync(respond, message);
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
	return handleInject(sendResponse);
}

function query(sendResponse) {
	sendResponse({ email, peers });
}

function setState(sendResponse, message) {
	setStateHelper(message.state);
	sendResponse(true);
}

function setStateHelper(state) {
	console.log("setting state", state);
	if (inject !== null) {
		injectedElement.value = JSON.stringify(state);
	} else {
		if (state.speed !== undefined) element.playbackRate = state.speed;
		if (state.time !== undefined)
			element.currentTime = determineTime(state);
		if (state.paused !== undefined) {
			if (state.paused) {
				element.pause();
			} else {
				element.play();
			}
		}
	}
}

function sync(sendResponse, message) {
	var key = message.key;
	var peer = peers[key];
	setStateHelper(peer);
	if (syncListener !== undefined) syncListener.off();
	var path = listenerRef.path.pieces_.concat(key).join("/");
	syncListener = db.ref(path);
	syncListener.on("value", function (snapshot) {
		if (hasManuallyChanged()) return syncListener.off();
		setStateHelper(snapshot);
	});
	syncListener = sendResponse(true);
}

// todo
function hasManuallyChanged() {
	return false;
}
