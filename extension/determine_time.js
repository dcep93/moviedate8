function determineTime(state) {
	if (state.paused) return state.time;
	var ageMs = Date.now() - parseInt(state.date);
	var secondsAdvanced = (ageMs * parseFloat(state.speed)) / 1000;
	return parseFloat(state.time) + secondsAdvanced;
}
