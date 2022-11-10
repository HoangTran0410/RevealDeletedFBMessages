// listen to event for changes from saved data in storage
chrome.storage.onChanged.addListener(function (changes, namespace) {
  // set a badge
  chrome.action.setBadgeText({ text: changes.total.newValue.toString() });
  // set badge color
  chrome.action.setBadgeBackgroundColor({ color: "#9688F1" });
});
