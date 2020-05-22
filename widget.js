const id = Math.random().toFixed(4).slice(2);
var listener;

function query(_, f) {
	window.onload = () => src && f([{ id }]);
}

function getProfileUserInfo(f) {
	f({ email: "widget" });
}

function sendMessage(_, payload, f) {
	listener(payload, null, f);
}

function addListener(f) {
	listener = f;
}

const handleInject = () => null;

window.chrome = {
	tabs: { query, sendMessage },
	identity: { getProfileUserInfo },
	runtime: { onMessage: { addListener } },
};
window.close = () => null;
