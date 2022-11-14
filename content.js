function injectScript(file_path) {
  let script = document.createElement("script");
  script.setAttribute("type", "text/javascript");
  script.setAttribute("src", file_path);
  script.onload = function () {
    this.parentNode.removeChild(this);
  };

  let doc = document.body || document.head || document.documentElement;
  doc.appendChild(script);
}

injectScript(chrome.runtime.getURL("./inject.js"));
