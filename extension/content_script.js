var email;
var peers;
var syncingStatus = {};

var element;

var syncListener;
var expected = null;

const CHANGE_DIFF_CUTOFF = 0.5;
const FOLLOW_UP_TICKS = 5;
const FOLLOW_UP_TICK_DURATION = 1000;
const FOLLOW_UP_MIN_PLAYBACK = 0.3;
const FOLLOW_UP_MAX_PLAYBACK = 3;
const FOLLOW_UP_CUTOFF = 0.001;

var SYNC_FOLLOWED = "followed";
var SYNC_SYNCING = "syncing";
var SYNC_SYNCED = "synced";
var SYNC_FAILED = "failed";
var SYNC_CLEARED = "cleared";

function followUp(state) {
	console.log("followUp");
	if (state.paused !== false) return;
	return ensurePlaying(state)
		.then(() => followUpHelper(state, FOLLOW_UP_TICKS))
		.then(() => {
			element.playbackRate = state.speed;
		});
}

function ensurePlaying(state) {
	var previous;
	return new Promise((resolve, reject) => {
		function helper(ticks) {
			var next = {
				time: getCurrentTime(),
				currentTime: element.currentTime,
			};
			if (previous !== undefined) {
				var elapsed = next.time - previous.time;
				var seeked = next.currentTime - previous.currentTime;
				var expected = (elapsed * (state.speed || 1)) / 1000;
				var diff = seeked - expected;
				if (Math.abs(diff) < FOLLOW_UP_CUTOFF) return resolve();
			}
			previous = next;
			if (ticks === 0) return reject("could not ensure playing");
			setTimeout(() => helper(ticks - 1), FOLLOW_UP_TICK_DURATION);
		}
		helper(FOLLOW_UP_TICKS);
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
			init(respond, message);
			return false;
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
	Promise.resolve()
		.then(beginReporting)
		.then(handleInject)
		.then(setDateOffset)
		.then(sendResponse);
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
		var injectState = Object.assign({}, state, {
			myDateOffset: dateOffset,
		});
		injectedElement.value = JSON.stringify(injectState);
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
	syncingStatus = { target: key, status: SYNC_SYNCING };
	setStateHelper(peer)
		.then(() => listenToPeer(path))
		.catch((err) => {
			syncingStatus.status = SYNC_FAILED;
			console.log(err);
		});
	sendResponse(true);
}

function listenToPeer(path) {
	if (syncListener !== undefined) syncListener.off();
	syncListener = db.ref(path);
	syncingStatus.status = SYNC_SYNCED;
	syncListener.on("value", function (snapshot) {
		var peer = snapshot.val();
		var state = getState();
		if (
			!expected ||
			isDifferent(expected, state, "me") ||
			expected.duration !== peer.duration
		) {
			console.log("clearing");
			syncingStatus.state = SYNC_CLEARED;
			return syncListener.off();
		}
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
	for (var key of ["speed", "paused"]) {
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
