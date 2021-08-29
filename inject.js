var s = document.createElement("script");
s.src = chrome.extension.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
s.onload = function () {
  this.parentNode.removeChild(this);
};

// Bắt đầu thêm vào DOM
let doc = document.body || document.documentElement;
doc.appendChild(s);
