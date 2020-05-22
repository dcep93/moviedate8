const id = Math.random().toFixed(4).slice(2);
const handleInject = () => null;
const inject = null;

var src = location.href.split("src=")[1];
const videoE = document.getElementById("video");
if (src) videoE.src = decodeURIComponent(src);

var listener;

function queryW(_, f) {
	window.onload = () => {
		src && f([{ id }]);
	};
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

const fromFileInput = document.getElementById("from_file");
fromFileInput.addEventListener("change", () => {
	src = fromFileInput.files[0];
	if (src) videoE.src = URL.createObjectURL(src);
	videoE.oncanplay = window.onload;
});

window.chrome = {
	tabs: { query: queryW, sendMessage: sendMessageW },
	identity: { getProfileUserInfo },
	runtime: { onMessage: { addListener } },
};
window.close = () => null;
