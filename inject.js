// https://stackoverflow.com/a/34414568
var script = document.createElement("script");
script.textContent =
  "const rvdfmExtensionId = " + JSON.stringify(chrome.runtime.id);
(document.head || document.documentElement).appendChild(script);
script.parentNode.removeChild(script);

// https://stackoverflow.com/a/25847017
window.addEventListener(
  "rvdfmPassToBackground",
  function (evt) {
    chrome.runtime.sendMessage(evt.detail);
  },
  false
);

// =========== inject websocket code ==========
var s = document.createElement("script");
s.src = chrome.extension.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
s.onload = function () {
  this.parentNode.removeChild(this);
};

// Bắt đầu thêm vào DOM
let doc = document.body || document.documentElement;
doc.appendChild(s);
