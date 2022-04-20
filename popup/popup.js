function handleToggle(value) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        message: "toggle",
        value: value,
      },
      function (response) {}
    );
  });
}

window.onload = () => {
  document.querySelector("#togBtn").addEventListener("change", (e) => {
    handleToggle(event.currentTarget.checked);
  });
};
