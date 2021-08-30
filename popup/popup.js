// chrome.storage.sync.get(["rvdfm"], function (result) {
//   console.log("Value currently is " + result.key);
// });

window.onload = () => {
  const list_div = document.querySelector("#list");
  const btn_refresh = document.querySelector("#btn_refresh");

  const refreshData = () => {
    const data = JSON.parse(localStorage.rvdfm || "[]");
    list_div.innerHTML =
      data
        .map((chat) => {
          const time = new Date(chat.time).toLocaleString();

          if (chat.msg_data.type === "new_msg_text")
            return `<li>${time}: <b>${chat.msg_data.content}</b></li>`;

          if (chat.msg_data.type == "new_msg_img")
            return chat.msg_data.content.split(",").map(
              (url) => `<li> ${time}: 
                            <img src="${url}" style="max-width: 120px; max-height: 120px;" />
                            <a href="${url}">Link ảnh</a> 
                        </li>`
            );
        })
        .join("") || "<h1 style='color: red;'>Chưa có gì cả</h1>";
  };

  btn_refresh.addEventListener("click", refreshData);

  setInterval(() => {
    refreshData();
  }, 5000);

  refreshData();
};
