const VERSION = "v4.1.0";

var email;
var peers;
var syncingStatus = {};

var element;

var syncListener;
var expected = null;

var stopReportingTimeout = null;

const ONE_HOUR_MS = 60 * 60 * 1000;

const SET_STATE_TIME_DIFF_CUTOFF = 1;

const CHANGE_DIFF_CUTOFF = 0.5;
const FOLLOW_UP_TICKS = 5;
const FOLLOW_UP_TICK_DURATION = 1000;
const FOLLOW_UP_MIN_PLAYBACK = 0.3;
const FOLLOW_UP_MAX_PLAYBACK = 3;
const FOLLOW_UP_CUTOFF = 0.001;

const SYNC_FOLLOWED = "followed";
const SYNC_SYNCING = "syncing";
const SYNC_SYNCED = "synced";
const SYNC_FAILED = "failed";
const SYNC_CLEARED = "cleared";

//

console.log("moviedate start", VERSION);

function getState() {
	var rawId = `${window.location.host || "local"}`;
	var id = rawId.replace(/\./g, "_");
	var speed = element.playbackRate;
	var time = element.currentTime;
	var paused = element.paused;
	var duration = element.duration;
	var date = getCurrentTime();
	var url = window.location.href;
	if (paused) {
		stopReportingInAnHour();
	} else {
		clearTimeout(stopReportingTimeout);
		stopReportingTimeout = null;
	}
	if (!duration) return console.log("no duration?");
	return {
		id,
		email,
		speed,
		time,
		paused,
		duration,
		date,
		dateOffset,
		url,
		syncingStatus,
		version: VERSION,
	};
}

function handleVal(val) {
	peers = val;
}

//

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	// console.log("receive", message.type, message);
	// var respond = (response) =>
	// 	console.log("send", response) || sendResponse(response);
	var respond = sendResponse;
	switch (message.type) {
		case "init":
			init(respond, message);
			return true;
		case "query":
			query(respond, message);
			break;
		case "set_state":
			setState(respond, message);
			break;
		case "sync":
			sync(respond, message);
			break;
		case "subtitles":
			addSubtitles(respond, message);
		default:
			return respond(`invalid type: ${message.type}`);
	}
});

function init(sendResponse, message) {
	element = document.getElementsByTagName("video")[0];
	if (element === undefined || isNaN(element.duration))
		return sendResponse("no video found");
	email = message.email;

	peers = { [email]: getState() };

	Promise.resolve()
		.then(getDb)
		.then(() => setTimeout(setDateOffset))
		.then(beginReporting)
		.then(handleInject)
		.then(() => dateOffset)
		.then(sendResponse);
}

function query(sendResponse) {
	// not ready yet
	if (peers === undefined) return sendResponse(undefined);
	sendResponse({ email, peers });
}

function setState(sendResponse, message) {
	if (message.state.dateOffset)
		dateOffset = parseFloat(message.state.dateOffset);
	setStateHelper(message.state);
	sendResponse(true);
}

function setStateHelper(state) {
	console.log("setting state", state);
	return setStatePromise(state)
		.then(followUp)
		.then(() => (expected = getState()));
}

function setStatePromise(state) {
	var diff = Math.abs(determineTime(state) - element.currentTime);
	if (diff < SET_STATE_TIME_DIFF_CUTOFF) delete state.time;
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
			return Promise.resolve()
				.then(() => element[f]())
				.then(() => state);
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

function addSubtitles(sendResponse, message) {
	track = element.addTextTrack("captions", "English", "en");
	track.mode = "showing";

	subtitleParser(message.content).forEach(track.addCue.bind(track));
	alert("subs", message.content.length);
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
			syncingStatus.status = SYNC_CLEARED;
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

function followUp(state) {
	console.log("followUp");
	if (state.paused !== false) return;
	return ensurePlaying(state)
		.then(() => tweakTimeToSync(state, FOLLOW_UP_TICKS))
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
				var expectedSeek = (elapsed * (state.speed || 1)) / 1000;
				var diff = seeked - expectedSeek;
				if (Math.abs(diff) < CHANGE_DIFF_CUTOFF) return resolve();
			}
			previous = next;
			if (ticks === 0) return reject("could not ensure playing");
			setTimeout(() => helper(ticks - 1), FOLLOW_UP_TICK_DURATION);
		}
		helper(FOLLOW_UP_TICKS);
	});
}

function tweakTimeToSync(state, ticks) {
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
			}).then(() => tweakTimeToSync(state, ticks - 1));
		}
	}
}

function stopReportingInAnHour() {
	if (stopReportingTimeout !== null) return;
	stopReportingTimeout = setTimeout(() => {
		clearInterval(reportInverval);
		reportInverval = undefined;
	}, ONE_HOUR_MS);
}
