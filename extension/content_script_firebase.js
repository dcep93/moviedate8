// https://console.firebase.google.com/u/0/project/moviedatesync/database/moviedatesync/data

var PREFIX = "data";
var FREQUENCY = 1000;

var db;
var listenerRef;
var reportInverval;

// need to define:
// type state {email: string, id: string}
// getState() state
// handleVal({string: state})

function getDb() {
	if (db === undefined) {
		var config = {
			databaseURL: "https://moviedatesync.firebaseio.com",
		};
		firebase.initializeApp(config);
		db = firebase.database();
	}
	return db;
}

function beginReporting() {
	if (reportInverval !== undefined) return;
	reportState();
	reportInverval = setInterval(reportState, FREQUENCY);
}

function setDateOffset() {
	if (dateOffset !== null) return;
	var path = ".info/serverTimeOffset";
	return db
		.ref(path)
		.once("value")
		.then(function (data) {
			dateOffset = data.val();
		});
}

function reportState() {
	var args = getState();
	if (!args) return;
	postToFirebase(args);
}

function postToFirebase(args) {
	var firebaseId = [PREFIX, args.id].join("/");
	var path = [firebaseId, args.key].join("/");
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
		var val = snapshot.val();
		handleVal(val);
	});
}
