localStorage.clear();

chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
  console.log(data);

  try {
    switch (data.type) {
      case "deleted_unknow_msg":
      case "deleted_msg": {
        const rvdfm = JSON.parse(localStorage.rvdfm || "[]");
        localStorage.rvdfm = JSON.stringify([...rvdfm, data]);

        console.log(localStorage);
        break;
      }
      case "new_msg_text":
      case "new_msg_media": {
        const msgs = JSON.parse(localStorage.rvdfmmsgs || "[]");
        localStorage.rvdfmmsgs = JSON.stringify([...msgs, data]);
        break;
      }
      default: {
        console.log("Nhận được event không xác định: ", data);
        break;
      }
    }
  } catch (e) {
    console.error(e);
  }
});
