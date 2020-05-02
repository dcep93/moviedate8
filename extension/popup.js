var FREQUENCY = 1000;

var emailDiv = document.getElementById("email");
var speedInput = document.getElementById("speed");
var timeInput = document.getElementById("time");
var versionDiv = document.getElementById("version");
var advancedDiv = document.getElementById("advanced");
var offsetInput = document.getElementById("dateOffset");

var form = document.getElementById("form");

var peerTemplate = document.getElementById("peer_template");
var peersDiv = peerTemplate.parentElement;

function init() {
	queryTab();
	setInterval(queryTab, FREQUENCY);
}

function queryTab() {
	if (tabId === undefined) return;
	chrome.tabs.sendMessage(tabId, { type: "query" }, function (response) {
		if (response === null || response === undefined) {
			allowNonValidPage();
		} else if (response.email !== undefined) {
			setPopupState(response);
		} else {
			window.close();
			console.log(response);
			return alert(response);
		}
	});
}

function submitForm() {
	if (tabId === undefined) return alert("script not loaded");
	var date = getCurrentTime();
	var state = { date };
	if (!document.activeElement) return alert("no active element?");
	state[document.activeElement.name] = document.activeElement.value;
	chrome.tabs.sendMessage(
		tabId,
		{ type: "set_state", state },
		receiveResponse
	);
	return false;
}

function sync(key) {
	if (tabId === undefined) return alert("sync error");
	chrome.tabs.sendMessage(tabId, { type: "sync", key }, receiveResponse);
}

function receiveResponse(response) {
	if (response === undefined) {
		allowNonValidPage();
	} else if (response !== true) {
		window.close();
		return alert(response);
	}
}

function setPopupState(state) {
	setPeers(state.peers, state.email);
}

function setSelfState(self) {
	dateOffset = self.dateOffset;
	emailDiv.innerText = self.email;
	setInput(speedInput, self.speed.toFixed(2));
	setInput(timeInput, determineTime(self).toFixed(2));
	setInput(offsetInput, self.dateOffset);
}

function setInput(element, value) {
	if (document.activeElement !== element) element.value = value;
}

function tooOld(peer) {
	var ageMs = getCurrentTime() - peer.date;
	var oneMinute = 1000 * 60;
	return ageMs > oneMinute;
}
function setPeers(peers, email) {
	var keys = Object.keys(peers);
	var myKey = keys.filter((key) => peers[key].email === email);
	var syncingStatus = peers[myKey].syncingStatus;
	for (var i = 0; i < keys.length; i++) {
		let key = keys[i];
		var peer = peers[key];
		if (peer.email === email) {
			setSelfState(peer);
			continue;
		}
		if (tooOld(peer)) continue;
		var id = btoa(key).replace(/=/g, "_");
		var peerDiv = peersDiv.querySelector(`#${id}`);
		if (!peerDiv) {
			peerDiv = peerTemplate.cloneNode(true);
			peerDiv.querySelector(".peer_email").innerText = peer.email;
			peerDiv.querySelector(".peer_sync").onclick = () => {
				sync(key);
			};
			peerDiv.setAttribute("id", id);
			peersDiv.appendChild(peerDiv);
		}
		if (peer.syncingStatus && peer.syncingStatus.target == myKey) {
			peerDiv.setAttribute("sync_follow", peer.syncingStatus.status);
		} else {
			peerDiv.removeAttribute("sync_follow");
		}
		if (syncingStatus && syncingStatus.target === key) {
			peerDiv.setAttribute("sync", syncingStatus.status);
		} else {
			peerDiv.removeAttribute("sync");
		}
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

versionDiv.onclick = () => (advancedDiv.hidden = false);

form.onsubmit = submitForm;

peersDiv.removeChild(peerTemplate);
peerTemplate.hidden = false;
peerTemplate.removeAttribute("id");
