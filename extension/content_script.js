if (window.location.host === "open.spotify.com") {
	const url = chrome.runtime.getURL("inject_spotify.js");
	fetch(url)
		.then((response) => response.text())
		.then((code) => {
			var script = document.createElement("script");
			script.textContent = code;
			document.head.appendChild(script);
		});
}

// types: start, stop, next, previous
// fields: bpm, bpl, bpr, tc, tt, tl, st

var functions = { start, stop, next, previous };
// element, interval, sentData, value, currentTime, title, timeout, loop
var state = {};

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log("receive", message, sender);
	if (message.type === "init") {
		state.sentData = null;
		state.interval = setInterval(sendData, 100);
		if (!setElement())
			sendResponse("no media element found - try starting it first");
		sendResponse(true);
	} else {
		state.value = message.message;
		var type = message.type;
		sendResponse(true);
		functions[type]();
	}
});

function sendData() {
	setElement();
	if (!state.element) return;
	var duration = state.element.duration;
	if (!duration) return;
	var mediaId = `${window.location.host}-${state.element.duration}`;
	var startTime = state.currentTime;
	var data = { mediaId, startTime };
	var stringified = JSON.stringify(data);
	if (state.sentData != stringified) {
		console.log("send", data);
		state.sentData = stringified;
		chrome.runtime.sendMessage(data);
	}
}

function setElement() {
	state.element = get();
	return state.element;
}

function get() {
	var video = document.getElementsByTagName("video")[0];
	if (video) return video;
	var audio = document.getElementsByTagName("audio")[0];
	if (audio) return audio;
	return false;
}

function start() {
	if (state.value.st) {
		state.element.currentTime = state.value.st;
	}
	state.currentTime = state.element.currentTime;
	stop();
	state.element.playbackRate = state.value.tc;
	begin();
}

function stop() {
	if (state.title !== undefined) {
		document.title = state.title;
		delete state.title;
	}
	clearTimeout(state.timeout);
	state.element.pause();
	if (state.currentTime !== undefined) {
		state.element.currentTime = state.currentTime;
	} else {
		state.currentTime = state.element.currentTime;
	}
	state.element.playbackRate = 1;
	state.loop = 0;
	state.timeout = null;
}

function next() {
	move(true);
}

function previous() {
	move(false);
}

function countIn() {
	state.loop += 1;
	speedUp();
	var ms = getMs(state.value.bpr);
	state.timeout = setTimeout(begin, ms);
}

function begin() {
	state.element.play();
	setTimeout(setTitle, 1000);
	var ms = getMs(state.value.bpl);
	state.timeout = setTimeout(finish, ms);
}

function setTitle() {
	if (state.title === undefined) state.title = document.title;
	document.title = `${(state.element.playbackRate * 100).toFixed(2)}% - ${
		state.title
	}`;
}

function finish() {
	if (state.element.paused) return stop();
	if (state.value.bpr != 0) state.element.pause();
	state.element.currentTime = state.currentTime;
	countIn();
}

function getMs(beats) {
	var msPerMinute = 60 * 1000;
	var ms = (beats * msPerMinute) / state.value.bpm;
	return ms / state.element.playbackRate;
}

function move(forward) {
	state.element.pause();
	state.loop = 0;
	var ms = getMs(state.value.bpl);
	var s = ms / 1000;
	var toMove = forward ? s : -s;
	state.currentTime += toMove;
	state.element.currentTime = state.currentTime;
	begin();
}

function speedUp() {
	state.element.playbackRate += getDiff(
		state.value.tc,
		state.value.tt,
		state.value.tl
	);
}

function getDiff(start, target, loops) {
	if (state.loop > loops) return 0;
	var range = target - start;
	return range / loops;
}
