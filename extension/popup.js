var tabId;
chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
	tabId = tabs[0].id;
	chrome.tabs.sendMessage(tabId, { type: "init", tabId }, (response) => {
		if (response === undefined) {
			tabId = undefined;
			allowNonValidPage();
		} else if (response === true) {
			// send message to background
			chrome.runtime.sendMessage({ tabId });
		} else {
			window.close();
			return alert(response);
		}
	});
});

function allowNonValidPage() {
	// means this is a non-spotify/youtube page - this is fine
	chrome.runtime.lastError;
}

//

var mediaId;

var stInput = document.getElementById("st");
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
	console.log(message, sender);
	// write start time based on state on the page
	if (message.startTime) stInput.value = message.startTime.toFixed(2);
	// load saved form data
	if (mediaId !== message.mediaId) {
		mediaId = message.mediaId;
		loadForm(mediaId);
	}
	sendResponse(true);
});

//

var form = document.getElementById("form");

function saveForm(id) {
	var formData = new FormData(form);
	var message = {};
	formData.forEach((value, key) => {
		message[key] = value;
	});
	if (id) chrome.storage.sync.set({ [id]: message });
	console.log("save", id, message);
	return message;
}

function loadForm(id) {
	console.log("load", id);
	chrome.storage.sync.get([id], function (result) {
		var object = result[id];
		console.log("set", id, object);
		for (var name in object) form[name].value = object[name];
	});
}

function saveDefault() {
	saveForm("default");
}

loadForm("default");

//

// you can hit 'enter' while focused on any input
var submitInput = document.createElement("input");
submitInput.type = "submit";
submitInput.style = "display: none";
var inputsRaw = document.getElementsByTagName("input");
var inputs = Array.from(inputsRaw);
for (var i = 0; i < inputs.length; i++) {
	var element = inputs[i];
	// when the input changes, save the state as
	// the last thing opened, 'default'
	element.onchange = saveDefault;
	element.parentElement.insertBefore(
		submitInput.cloneNode(),
		element.nextSibling
	);
}
// chrome seems to size the popup strangely
document.getElementsByTagName("html")[0].style.height = form.offsetHeight;

//

function sendMessage(type) {
	var message = saveForm(mediaId);
	var data = { type, message };
	if (tabId !== undefined) {
		chrome.tabs.sendMessage(tabId, data);
	} else {
		chrome.runtime.sendMessage(data, function (response) {
			if (!response)
				alert(
					"Need to initialize on either youtube.com or open.spotify.com"
				);
		});
	}
	return false;
}

var buttonNames = ["start", "stop", "next", "previous"];
buttonNames.forEach((type) => {
	document.getElementById(type).onclick = () => sendMessage(type);
});

form.onsubmit = () => sendMessage("start");

//

var taps = [];
var numTaps = 10;
var msPM = 1000 * 60;
var bpmInput = document.getElementById("bpm");
function tap() {
	var now = new Date();
	taps.push(now);
	if (taps.length > numTaps) taps.shift();
	var ms = now - taps[0];
	var bpm = (msPM * (taps.length - 1)) / ms;
	if (bpm && bpm !== Infinity) {
		bpmInput.value = bpm.toFixed(2);
	}
}
document.getElementById("tap").onclick = tap;
