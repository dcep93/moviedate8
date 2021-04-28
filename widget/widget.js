const id = Math.random().toFixed(4).slice(2);
const handleInject = () => null;
const inject = null;

var initializedBad = false;
var src;
var listener;
var videoE;
var queryF;
var initializedW = false;

function initW() {
  if (initializedBad) return;
  initializedBad = true;
  videoE = document.getElementById("video");
  videoE.oncanplay = queryF;
  if (!src) {
    src = location.href.split("src=")[1];
    if (src) {
      console.log(src, decodeURIComponent(src));
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

  document.getElementById("version").innerText = VERSION;
}

function queryW(_, f) {
  queryF = () => {
    if (initializedW) return;
    initializedW = true;
    const _handleVal = handleVal;
    handleVal = function (val) {
      _handleVal(val);
      maybeSync();
    };
    f([{ id }]);
    maybeAddSubtitlesFromUrlQuery();
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

function maybeAddSubtitlesFromUrlQuery() {
  const subsUrl = location.href.split("subs=")[1];
  if (subsUrl) {
    const url = `https://cors-anywhere.herokuapp.com/${decodeURIComponent(
      subsUrl
    )}`;
    fetch(url)
      .then((response) => response.text())
      .then((content) =>
        sendMessageW(null, { type: "subtitles", content }, () =>
          console.log("loaded subs", subsUrl)
        )
      )
      .catch(alert);
  }
}

var hasSynced = false;
function maybeSync() {
  if (hasSynced) return;
  var key = location.href.split("sync=")[1];
  if (key) {
    sendMessageW(null, { type: "sync", key }, () => {
      console.log("synced to", key);
      hasSynced = true;
    });
  }
}

window.chrome = {
  tabs: { query: queryW, sendMessage: sendMessageW },
  identity: { getProfileUserInfo },
  runtime: { onMessage: { addListener } },
};
window.close = () => null;
