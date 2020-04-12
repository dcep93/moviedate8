// Spotify removes the audio tag once created
// use this to keep it around
(function () {
	var defaultCreateElement = document.createElement;
	document.createElement = function (tagName) {
		var element = defaultCreateElement.apply(this, arguments);
		if (tagName === "audio") document.head.appendChild(element);
		return element;
	};
})();
