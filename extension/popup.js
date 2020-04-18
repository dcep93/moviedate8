var FREQUENCY = 1000;

var emailDiv = document.getElementById("email");
var speedInput = document.getElementById("speed");
var timeInput = document.getElementById("time");

var form = document.getElementById("form");

var peerTemplate = document.getElementById("peer_template");
var peersDiv = peerTemplate.parentElement;

window.onload = () => {
	queryTab();
	setInterval(queryTab, FREQUENCY);
};

function queryTab() {
	if (tabId === undefined) return;
	chrome.tabs.sendMessage(tabId, { type: "query" }, function (response) {
		if (response === undefined) {
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
	var date = Date.now();
	var state = { date };
	if (document.activeElement === speedInput) state.speed = speedInput.value;
	if (document.activeElement === timeInput) state.time = timeInput.value;
	setElementState(state);
	return false;
}

function sync(state) {
	if (tabId === undefined) return alert("sync error");
	setElementState(state);
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

form.onsubmit = submitForm;

function setPopupState(state) {
	setPeers(state.peers, state.email);
}

function setSelfState(self) {
	emailDiv.innerText = self.email;
	if (document.activeElement !== speedInput)
		speedInput.value = self.speed.toFixed(2);
	if (document.activeElement !== timeInput)
		timeInput.value = determineTime(self).toFixed(2);
}

peersDiv.removeChild(peerTemplate);
peerTemplate.hidden = false;
peerTemplate.removeAttribute("id");
function setPeers(peers, email) {
	var keys = Object.keys(peers);
	for (var i = 0; i < keys.length; i++) {
		var key = keys[i];
		let peer = peers[key];
		if (peer.email === email) {
			setSelfState(peer);
			continue;
		}
		if (tooOld(peer)) continue;
		var id = `peer-${key}`.replace(/@/g, "_").replace(/\?/g, "_");
		var peerDiv = peersDiv.querySelector(`#${id}`);
		if (!peerDiv) {
			peerDiv = peerTemplate.cloneNode(true);
			peerDiv.querySelector(".peer_email").innerText = peer.email;
			peerDiv.querySelector(".peer_sync").onclick = () => {
				sync(peer);
			};
			peerDiv.setAttribute("id", id);
			peersDiv.appendChild(peerDiv);
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

function tooOld(peer) {
	var ageMs = Date.now() - peer.date;
	var oneMinute = 1000 * 60;
	return ageMs > oneMinute;
}
