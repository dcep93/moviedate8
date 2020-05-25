const id = Math.random().toFixed(4).slice(2);
const handleInject = () => null;
const inject = null;

var src;
var listener;
var videoE;
var queryF;
var initializedW = false;

function initW() {
	videoE = document.getElementById("video");
	videoE.oncanplay = queryF;
	if (!src) {
		src = location.href.split("src=")[1];
		if (src) {
			videoE.src = decodeURIComponent(src);
		}
	}

	const fromFileInput = document.getElementById("from_file");
	fromFileInput.addEventListener("change", () => {
		src = fromFileInput.files[0];
		if (src) {
			videoE.src = URL.createObjectURL(src);
		}
	});
}

function queryW(_, f) {
	queryF = () => {
		if (initializedW) return;
		initializedW = true;
		f([{ id }]);
	};
	window.onload = initW;
}

function getProfileUserInfo(f) {
	f({ email: "widget" });
}

function sendMessageW(_, payload, f) {
	listener(payload, null, f);
}

function addListener(f) {
	listener = f;
}

window.chrome = {
	tabs: { query: queryW, sendMessage: sendMessageW },
	identity: { getProfileUserInfo },
	runtime: { onMessage: { addListener } },
};
window.close = () => null;
