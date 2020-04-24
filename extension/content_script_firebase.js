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

function getState() {
	var rawId = `${window.location.host || "local"}`;
	var id = rawId.replace(/\./g, "_");
	var speed = element.playbackRate;
	var time = element.currentTime;
	var paused = element.paused;
	var duration = element.duration;
	var date = Date.now();
	return { id, email, speed, time, paused, duration, date };
}

function reportState() {
	var args = getState();
	postToFirebase(args);
}

function postToFirebase(args) {
	var emailKey = args.email.replace(/\./g, "_");
	var firebaseId = [PREFIX, args.id].join("/");
	var path = [firebaseId, emailKey].join("/");
	db.ref(path).set(args).catch(alert);

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