var email;
var peers;

var element;

var syncListener;
var expected = null;

const CHANGE_DIFF_CUTOFF = 0.5;
const FOLLOW_UP_TICKS = 10;
const FOLLOW_UP_TICK_DURATION = 1000;
const FOLLOW_UP_MIN_PLAYBACK = 0.3;
const FOLLOW_UP_MAX_PLAYBACK = 3;
const FOLLOW_UP_CUTOFF = 0.001;

function followUp(state) {
	if (state.paused !== false) return;
	return Promise.resolve()
		.then(() => followUpHelper(state, FOLLOW_UP_TICKS))
		.then(() => {
			element.playbackRate = state.speed;
		});
}

function followUpHelper(state, ticks) {
	if (ticks > 0) {
		var stateTime = determineTime(state);
		var diff = stateTime - element.currentTime;
		if (diff === 0 || Math.abs(diff) > FOLLOW_UP_CUTOFF) {
			var relative = (1000 * diff) / FOLLOW_UP_TICK_DURATION;
			var newPlayback = state.speed + relative;
			if (newPlayback < FOLLOW_UP_MIN_PLAYBACK) {
				if (relative < 0) return;
				newPlayback = FOLLOW_UP_MIN_PLAYBACK;
			} else if (newPlayback > FOLLOW_UP_MAX_PLAYBACK) {
				if (relative > 0) return;
				newPlayback = FOLLOW_UP_MAX_PLAYBACK;
			}
			console.log("diff", diff, newPlayback);
			// luckily this works for netflix too!
			element.playbackRate = newPlayback;
			return new Promise((resolve) => {
				setTimeout(resolve, FOLLOW_UP_TICK_DURATION);
			}).then(() => followUpHelper(state, ticks - 1));
		}
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
	// not ready yet
	if (peers === undefined) return sendResponse(undefined);
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
