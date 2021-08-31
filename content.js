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

// ============================= inject websocket code ============================
var s = document.createElement("script");
s.src = chrome.extension.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
s.onload = function () {
  this.parentNode.removeChild(this);
};

// Bắt đầu thêm vào DOM
let doc = document.body || document.documentElement;
doc.appendChild(s);

// =========================== Notification ===============================
// Notification body.
const notification = document.createElement("div");
notification.className = "rvdfm-notification";

// Notification icon.
const icon = document.createElement("img");
icon.src = chrome.runtime.getURL("icons/icon32.png");
notification.appendChild(icon);

// Notification text.
const notificationText = document.createElement("p");
notification.appendChild(notificationText);

// Add to current page.
doc.appendChild(notification);

// Show notification after 5 seconds
setTimeout(() => {
  const notification = document.getElementsByClassName("rvdfm-notification")[0];
  const notificationText = notification.getElementsByTagName("p")[0];

  notificationText.innerHTML =
    "RVFDM - Xem tin nhắn bị gỡ trên fb <b>ĐANG BẬT</b>";
  notification.style.bottom = "30px";

  setTimeout(function () {
    notification.style.bottom = "-300px";
  }, 5000);
}, 5000);
