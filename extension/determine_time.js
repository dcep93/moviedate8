var dateOffset;

function determineTime(state) {
	if (state.paused || !state.speed) return state.time;
	var ageMs = getCurrentTime() - parseInt(state.date);
	var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
	return parseFloat(state.time) + secondsAdvanced;
}

function getCurrentTime() {
	return Date.now() + (dateOffset || 0);
}
