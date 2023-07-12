// ============================= inject websocket code ============================
var inject_ws_script = document.createElement("script");
inject_ws_script.src = chrome.runtime.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
inject_ws_script.onload = function () {
  this.parentNode.removeChild(this);
};

// // Bắt đầu thêm vào DOM
let doc = document.body || document.head || document.documentElement;
doc.appendChild(inject_ws_script);
