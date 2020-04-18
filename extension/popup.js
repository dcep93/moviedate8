// https://console.firebase.google.com/u/0/project/moviedatesync/database/moviedatesync/data

var PREFIX = "data";
var FREQUENCY = 1000;

var speedInput = document.getElementById("speed");
var timeInput = document.getElementById("time");

var form = document.getElementById("form");

var peerTemplate = document.getElementById("peer_template");
var peersDiv = peerTemplate.parentElement;

var val;

var db;
var listenerRef;

var email;

var selfDate;

// should be same as content_script.js
function determineTime(state) {
	if (state.paused) return state.time;
	var ageMs = Date.now() - parseInt(state.date);
	var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
	return parseFloat(state.time) + secondsAdvanced;
}

function setPopupState(state) {
	if (document.activeElement && document.activeElement.tagName == "INPUT")
		return;
	speedInput.value = state.speed.toFixed(2);
	timeInput.value = determineTime(state).toFixed(2);
}

function tooOld(peer) {
	return false;
	var ageMs = Date.now() - peer.date;
	var oneMinute = 1000 * 60;
	return ageMs > oneMinute;
}

function submitForm() {
	var speed = speedInput.value;
	var time = timeInput.value;
	var date = Date.now();
	setElementState({ speed, time, date });
	return false;
}

function setElementState(state) {
	chrome.tabs.sendMessage(tabId, { type: "sync", state }, function (
		response
	) {
		if (response === undefined) {
			allowNonValidPage();
		} else if (response !== true) {
			window.close();
			return alert(response);
		}
	});
}

function sync(key) {
	if (tabId === undefined) return alert("sync error");
	var state = val[key];
	setElementState(state);
}

form.onsubmit = submitForm;

peersDiv.removeChild(peerTemplate);
peerTemplate.hidden = false;
peerTemplate.removeAttribute("id");
function setPeers(val_) {
	val = val_;
	if (notMyUpdate(val_)) return;
	var peers = Object.keys(val);
	for (var i = 0; i < peers.length; i++) {
		let key = peers[i];
		var peer = val[key];
		if (peer.email === email) continue;
		if (tooOld(peer)) continue;
		var id = `peer-${key}`.replace(/@/g, "_").replace(/\?/g, "_");
		var peerDiv = peersDiv.querySelector(`#${id}`);
		if (!peerDiv) {
			peerDiv = peerTemplate.cloneNode(true);
			peerDiv.querySelector(".peer_email").innerText = peer.email;
			peerDiv.querySelector(".peer_sync").onclick = () => {
				sync(key);
			};
			peersDiv.appendChild(peerDiv);
		}
		peerDiv.setAttribute("id", id);
		peerDiv.querySelector(".peer_speed").innerText = peer.speed.toFixed(2);
		peerDiv.querySelector(".peer_time").innerText = determineTime(
			peer
		).toFixed(2);
		if (peer.paused) {
			peerDiv.classList.add("paused");
		} else {
			peerDiv.classList.remove("paused");
		}
	}
}

function notMyUpdate(val) {
	var me = Object.values(val).filter((peer) => peer.email === email)[0];
	if (me) {
		var date = me.date;
		if (date !== selfDate) {
			selfDate = date;
			return true;
		}
	}
	return false;
}

function queryTab() {
	if (tabId === undefined) return;
	chrome.tabs.sendMessage(tabId, { type: "query" }, function (response) {
		if (response === undefined) {
			allowNonValidPage();
		} else if (response.id !== undefined) {
			postToFirebase(response);
		} else {
			window.close();
			return alert(response);
		}
	});
}

function initializeFirebase() {
	var config = {
		databaseURL: "https://moviedatesync.firebaseio.com",
	};
	firebase.initializeApp(config);
	db = firebase.database();
	queryTab();
	setInterval(queryTab, FREQUENCY);
}

function postToFirebase(state) {
	if (setPopupState(state)) return;
	if (db === undefined) return;
	var emailKey = email.replace(/\./g, "_");
	var path = [PREFIX, state.id, emailKey].join("/");
	state.email = email;
	db.ref(path).set(state).catch(alert);

	listen(state.id);
}

function listen(id) {
	if (listenerRef !== undefined) listenerRef.off();
	listenerRef = db.ref(`${PREFIX}/${id}`);
	listenerRef.on("value", function (snapshot) {
		var val = snapshot.val();
		setPeers(val);
	});
}

function fetchEmailAndInitializeFirebase() {
	chrome.identity.getProfileUserInfo(function (info) {
		email = info.email || "?";
		document.getElementById("email").innerText = email;
		initializeFirebase();
	});
}

window.onload = fetchEmailAndInitializeFirebase;
