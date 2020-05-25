var dateOffset = null;

function determineTime(state) {
	if (state.paused || !state.speed) return state.time;
	const ct = getCurrentTime();
	var ageMs = ct - parseInt(state.date);
	var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
	t = parseFloat(state.time) + secondsAdvanced;
	return t;
}

function getCurrentTime() {
	return Date.now() + (dateOffset || 0);
}
