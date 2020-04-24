var email;
var peers;

var element;

var syncListener;
var expected = null;

const CHANGE_DIFF_CUTOFF = 0.05;
const FOLLOW_UP_TICKS = 10;
const FOLLOW_UP_TICK_DURATION = 100;
const FOLLOW_UP_MIN_PLAYBACK = 0.1;
const FOLLOW_UP_MAX_PLAYBACK = 5;

// todo
function followUp(state, ticks) {
	if (state.paused !== false) return;
	if (ticks === undefined) ticks = FOLLOW_UP_TICKS;
	if (ticks > 0) {
		var stateTime = determineTime(state);
		var diff = stateTime - element.currentTime;
		var relative = diff / FOLLOW_UP_TICK_DURATION;
		var newPlayback = element.playbackRate + relative;
		newPlayback = Math.max(newPlayback, FOLLOW_UP_MIN_PLAYBACK);
		newPlayback = Math.min(newPlayback, FOLLOW_UP_MAX_PLAYBACK);
		// luckily this works for netflix too!
		element.playbackRate = newPlayback;
		return new Promise((resolve) => {
			setTimeout(resolve, FOLLOW_UP_TICK_DURATION);
		}).then(() => followUp(state, ticks - 1));
	} else {
		element.playbackRate = state.speed;
	}
}

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
	return setStatePromise(state).then(followUp);
}

function setStatePromise(state) {
	if (inject !== null) {
		injectedElement.value = JSON.stringify(state);
		return new Promise((resolve) => {
			var interval = setInterval(() => {
				if (injectedElement.value !== "") return;
				clearInterval(interval);
				resolve(state);
			});
		});
	} else {
		if (state.speed !== undefined) element.playbackRate = state.speed;
		if (state.time !== undefined)
			element.currentTime = determineTime(state);
		if (state.paused !== undefined) {
			var f = state.paused ? "pause" : "play";
			return element[f]().then(() => state);
		} else {
			return Promise.resolve(state);
		}
	}
}

function sync(sendResponse, message) {
	if (syncListener !== undefined) syncListener.off();
	var key = message.key;
	var peer = peers[key];
	var path = listenerRef.path.pieces_.concat(key).join("/");
	setStateHelper(peer).then(() => {
		listenToPeer(path);
	});
	sendResponse(true);
}

function listenToPeer(path) {
	if (syncListener !== undefined) syncListener.off();
	syncListener = db.ref(path);
	syncListener.on("value", function (snapshot) {
		var peer = snapshot.val();
		var state = getState();
		if (
			!expected ||
			isDifferent(expected, state, "me") ||
			expected.duration !== peer.duration
		)
			return syncListener.off();
		if (isDifferent(expected, peer, "peer")) {
			setStateHelper(peer);
		}
	});
}

function isDifferent(a, b, tag) {
	var aTime = determineTime(a);
	var bTime = determineTime(b);
	var diff = Math.abs(aTime - bTime);
	if (diff > CHANGE_DIFF_CUTOFF) {
		logDifferent(tag, "*time", aTime, bTime);
		return true;
	}
	for (var key in a) {
		if (key == "date" || key == "time" || key == "email") continue;
		if (a[key] != b[key]) {
			logDifferent(tag, key, a[key], b[key]);
			return true;
		}
	}
	return false;
}

function logDifferent(tag, key, meKey, expectedKey) {
	console.log(`different ${tag} ${key} ${meKey} ${expectedKey}`);
	expected = null;
}
