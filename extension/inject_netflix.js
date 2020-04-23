// Netflix doesn't let currentTime change in the regular way :/
// use this to allow mutation
(function () {
	const NETFLIX_OFFSET = 0.65;
	// Netflix specific start
	const videoPlayer = netflix.appContext.state.playerApp.getAPI().videoPlayer;
	const player = videoPlayer.getVideoPlayerBySessionId(
		videoPlayer.getAllPlayerSessionIds()[0]
	);

	function setSpeed(state) {
		player.setPlaybackRate(state.speed);
	}

	function setTime(state) {
		var timeS = determineTime(state);
		timeS += NETFLIX_OFFSET;
		var timeMS = timeS * 1000;
		player.seek(timeMS);
	}

	function setPaused(state) {
		var f = state.paused ? "pause" : "play";
		player[f]();
	}

	// Netflix specific end

	const CHECK_FREQUENCY = 10;
	const INJECTED_ELEMENT_ID = "moviedate-injected-element";

	var injectedElement = document.createElement("input");
	injectedElement.setAttribute("id", INJECTED_ELEMENT_ID);
	document.head.appendChild(injectedElement);

	function determineTime(state) {
		if (state.paused) return state.time;
		var ageMs = Date.now() - parseInt(state.date);
		var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
		return parseFloat(state.time) + secondsAdvanced;
	}

	function checkForChange() {
		var value = injectedElement.value;
		if (value) {
			var state = JSON.parse(value);
			if (state.speed !== undefined) setSpeed(state);
			if (state.time !== undefined) setTime(state);
			if (state.paused !== undefined) setPaused(state);
			injectedElement.value = "";
		}
	}

	setInterval(checkForChange, CHECK_FREQUENCY);
})();
