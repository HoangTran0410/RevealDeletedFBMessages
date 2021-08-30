localStorage.clear();

chrome.runtime.onMessage.addListener(function (data, sender, sendResponse) {
  console.log(data);

  switch (data.type) {
    case "deleted_msg": {
      try {
        const old_data = JSON.parse(localStorage.rvdfm || "[]");
        localStorage.rvdfm = JSON.stringify([...old_data, data]);

        console.log(localStorage);
      } catch (e) {
        console.error(e);
      }
    }
    case "new_msg_text": {
    }
    case "new_msg_img": {
    }
  }
});
