var email;
var peers;

var element;

var syncListener;
var expected = null;

const CHANGE_DIFF_CUTOFF = 0.5;
const SYNC_DELAY = 1000;

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
	expected = null;
	sendResponse(true);
}

function setStateHelper(state) {
	console.log("setting state", state);
	expected = state;
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
	if (syncListener !== undefined) syncListener.off();
	var key = message.key;
	var peer = peers[key];
	setStateHelper(peer);
	var path = listenerRef.path.pieces_.concat(key).join("/");
	setTimeout(() => listenToPeer(path), SYNC_DELAY);
	sendResponse(true);
}

function listenToPeer(path) {
	if (syncListener !== undefined) syncListener.off();
	syncListener = db.ref(path);
	syncListener.on("value", function (snapshot) {
		if (hasManuallyChanged()) return syncListener.off();
		setStateHelper(snapshot.val());
	});
}

function hasManuallyChanged() {
	if (expected === null) return true;
	var me = getState();
	delete me.email;
	var meTime = determineTime(me);
	var expectedTime = determineTime(expected);
	var diff = Math.abs(meTime - expectedTime);
	if (diff > CHANGE_DIFF_CUTOFF) {
		logManualChange("*time", meTime, expectedTime);
		return true;
	}
	delete me.date;
	delete me.time;
	for (var key in me) {
		if (me[key] != expected[key]) {
			logManualChange(key, me[key], expected[key]);
			return true;
		}
	}
	return false;
}

function logManualChange(key, meKey, expectedKey) {
	console.log(`manually changed ${key} ${meKey} ${expectedKey}`);
	expected = null;
}
