// Netflix doesn't let currentTime change in the regular way :/
// use this to allow mutation
(function () {
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

	var dateOffset;

	var injectedElement = document.createElement("input");
	injectedElement.setAttribute("id", INJECTED_ELEMENT_ID);
	document.head.appendChild(injectedElement);

	function determineTime(state) {
		if (state.paused || !state.speed) return state.time;
		var ageMs = getCurrentTime() - parseInt(state.date);
		var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
		return parseFloat(state.time) + secondsAdvanced;
	}

	function getCurrentTime() {
		return Date.now() + (dateOffset || 0);
	}

	function checkForChange() {
		var value = injectedElement.value;
		if (value) {
			var state = JSON.parse(value);
			dateOffset = state.myDateOffset;
			if (state.speed !== undefined) setSpeed(state);
			if (state.time !== undefined) setTime(state);
			if (state.paused !== undefined) setPaused(state);
			resetInjected();
		}
	}

	function resetInjected() {
		injectedElement.value = "";
	}

	setInterval(checkForChange, CHECK_FREQUENCY);
})();
