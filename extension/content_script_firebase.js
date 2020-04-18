// https://console.firebase.google.com/u/0/project/moviedatesync/database/moviedatesync/data

var PREFIX = "data";
var FREQUENCY = 1000;

var db;
var listenerRef;

function beginReporting() {
	var config = {
		databaseURL: "https://moviedatesync.firebaseio.com",
	};
	firebase.initializeApp(config);
	db = firebase.database();
	reportState();
	setInterval(reportState, FREQUENCY);
}

function reportState() {
	var rawId = `${window.location.host || "local"}`;
	var id = rawId.replace(/\./g, "_");
	var speed = element.playbackRate;
	var time = element.currentTime;
	var paused = element.paused;
	var date = Date.now();
	var state = { id, email, speed, time, paused, date };

	postToFirebase(state);
}

function postToFirebase(state) {
	var emailKey = state.email.replace(/\./g, "_");
	var firebaseId = [PREFIX, state.id].join("/");
	var path = [firebaseId, emailKey].join("/");
	db.ref(path).set(state).catch(alert);

	listen(firebaseId);
}

function listen(firebaseId) {
	if (listenerRef !== undefined) {
		if (listenerRef.path.pieces_.join("/") == firebaseId) return;
		listenerRef.off();
	}
	listenerRef = db.ref(firebaseId);
	listenerRef.on("value", function (snapshot) {
		peers = snapshot.val();
	});
}
