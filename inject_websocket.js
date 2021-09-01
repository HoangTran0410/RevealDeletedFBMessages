// Lưu tất cả tin nhắn - có thể truy cập được từ console trong web facebook
let rvdfm_all_msgs = [];

// Hàm dùng để xóa hết tin nhắn đã lưu - có thể dùng từ console
const rvdfm_clear = () => {
  const count = rvdfm_all_msgs.length;
  rvdfm_all_msgs.length = 0;
  localStorage.removeItem("rvdfm_all_msgs");

  console.log(`> ĐÃ XÓA ${count} TIN NHẮN ĐƯỢC LƯU BỞI RVDFM.`);
};

(function () {
  console.log("Extension RVDFM - Xem Tin Nhắn Bị Gỡ Trên FB đã BẬT");

  rvdfm_all_msgs = JSON.parse(localStorage.rvdfm_all_msgs || "[]");
  console.log(
    `RVDFM Đã tải lên ${rvdfm_all_msgs.length} tin nhắn từ LocalStorage.`
  );

  // Lưu lại vào localStorage mỗi khi tắt tab
  window.addEventListener("beforeunload", () => {
    localStorage.rvdfm_all_msgs = JSON.stringify(rvdfm_all_msgs);
  });

  //#region ============================ Những hàm hỗ trợ ============================
  // Hàm decode data websocket về tiếng việt, loại bỏ những thằng \\
  const parse = (str) => {
    let ret = str;
    let limit = 10;
    while (--limit > 0) {
      try {
        if (ret[0] === '"') ret = JSON.parse(ret);
        else ret = JSON.parse(`"${ret}"`);
      } catch (e) {
        break;
      }
    }
    return ret;
  };

  // Hàm xuất ra console, xuất chữ và hình - https://stackoverflow.com/a/26286167
  const log = {
    text: (str, color = "white", bg = "transparent") => {
      console.log(`%c${str}`, `color: ${color}; background: ${bg}`);
    },
    media: (url) => {
      if (url.includes("video")) {
        log.text("video:");
        console.log(url);
      } else {
        var img = new Image();
        img.onload = function () {
          const ratio = this.width / this.height;
          const h = this.height > 150 ? 300 : 150,
            w = ratio * h;
          var style = [
            "font-size: 1px;",
            `line-height: ${h % 2}px;`,
            `padding: ${h * 0.5}px ${w * 0.5}px;`,
            `background-size: ${w}px ${h}px;`,
            `background-image: url("${url}")`,
          ].join(" ");
          console.log(url);
          console.log("%c ", style);
        };
        img.onerror = function () {
          console.log("[Không tải được ảnh]", url);
        };
        img.src = url;
      }
    },
  };

  // https://stackoverflow.com/a/25847017
  const sendToBackgroundJs = (data) => {
    var event = new CustomEvent("rvdfmPassToBackground", { detail: data });
    window.dispatchEvent(event);
  };

  const sendCounterToContentJs = (count, newLength) => {
    var event = new CustomEvent("rvdfmShowCounter", {
      detail: { count, newLength },
    });
    window.dispatchEvent(event);
  };

  sendCounterToContentJs(0, rvdfm_all_msgs.length);

  const sendDeletedMsgToContentJs = (msg) => {
    var event = new CustomEvent("rvdfmDeletedMsg", {
      detail: msg,
    });
    window.dispatchEvent(event);
  };
  // #endregion

  //#region ========================================= BẮT ĐẦU HACK :)) =========================================

  // Lưu lại webSocket gốc của browser
  const original_WebSocket = window.WebSocket;

  // Tạo 1 fake webSocket constructor - facebook sẽ gọi hàm này để tạo socket
  window.WebSocket = function fakeConstructor(dt, config) {
    const websocket_instant = new original_WebSocket(dt, config);

    // Chèn event on message => để bắt tất cả event được dùng bởi facebook trong webSocket
    websocket_instant.addEventListener("message", async function (achunk) {
      // chuyển binary code của websocket về string utf8
      const utf8_str = new TextDecoder("utf-8").decode(achunk.data);

      if (utf8_str[0] === "1" || utf8_str[0] === "2" || utf8_str[0] === "3") {
        // Xem trong dữ liệu có id của tin nhắn nào không
        const have_msg_id = utf8_str.match(/(?=mid\.\$)(.*?)(?=\\")/);
        if (!have_msg_id) return;

        // Lấy ra tất cả các thông tin dùng được trong dữ liệu (những chuỗi nằm giữa 2 dấu nháy kép)
        const all_strings_regex = /(\\\")(.*?)(\\\")(?=,)/g;
        let all_strings = utf8_str.match(all_strings_regex) || [];
        all_strings = all_strings.map((str) => parse(str));

        log.text(
          "RVDFM - VÀO LÚC " + new Date().toLocaleString(),
          "blue",
          "#fff9"
        );
        console.log("Mọi thông tin: ", { all: all_strings });

        // hàm hỗ trợ
        const isMsgIdStr = (str) => str?.startsWith("mid.$");
        const isLink = (str) => str?.startsWith("https://");

        // Bắt đầu lấy ra những tin nhắn từ lượng thông tin trên
        let chat = [];
        for (let i = 0; i < all_strings.length; i++) {
          const str_i = all_strings[i];

          // Tin nhắn chữ
          if (
            (str_i === "124" || str_i === "123") &&
            isMsgIdStr(all_strings[i + 2])
          ) {
            const content = all_strings[i + 1];
            if (content) {
              chat.push({
                type: "Chữ",
                content: content,
                id: all_strings[i + 2],
              });
            }
          }

          // Tin nhắn đính kèm: image / gif / video / âm thanh / file
          if (str_i === "591" && isLink(all_strings[i + 2])) {
            const isImg = all_strings[i + 1]?.startsWith("image-");
            const isGif = all_strings[i + 1]?.startsWith("gif-");
            const isVideo = all_strings[i + 1]?.startsWith("video-");
            const isAudio = all_strings[i + 1]?.startsWith("audioclip-");

            const type = isImg
              ? "Hình ảnh"
              : isGif
              ? "GIF"
              : isVideo
              ? "Video"
              : isAudio
              ? "Âm thanh"
              : "Đính kèm";

            for (let j = i; j < all_strings.length - 1; j++) {
              if (isMsgIdStr(all_strings[j])) {
                chat.push({
                  type: type,
                  content: all_strings[i + 2],
                  id: all_strings[j],
                });
                break;
              }
            }
          }

          // Tin nhắn nhãn dán
          if (str_i === "144" && isMsgIdStr(all_strings[i + 1])) {
            chat.push({
              type: "Nhãn dán",
              content: all_strings[i + 3],
              id: all_strings[i + 1],
            });
          }

          // Thả react
          if (str_i === "110" && isMsgIdStr(all_strings[i + 1])) {
            chat.push({
              type: "Thả react",
              content: all_strings[i + 2],
              id: all_strings[i + 1],
            });
          }

          // Gỡ react
          if (str_i === "111" && isMsgIdStr(all_strings[i + 1])) {
            const id = all_strings[i + 1];
            const content =
              rvdfm_all_msgs.find((c) => c.id === id)?.content || "";

            chat.push({
              type: "Gỡ react",
              content: content,
              id: id,
            });
          }

          // Tin nhắn chia sẻ: link / vị trí / vị trí trực tiếp
          if (
            str_i === "414" &&
            isMsgIdStr(all_strings[i + 2]) &&
            isLink(all_strings[i + 5])
          ) {
            const link = all_strings[i + 5];

            chat.push({
              type: "Chia sẻ",
              content: link,
              id: all_strings[i + 2],
            });
          }

          // Thông tin user
          // if (str_i === "533" && isLink(all_strings[i + 1])) {
          //   const avatar = all_strings[i + 1];
          //   const user_name = all_strings[i + 2];

          //   chat.push({
          //     type: "Người dùng",
          //     avatar: avatar,
          //     name: user_name,
          //   });
          // }

          // Tin nhắn đang chờ
          // if (str_i === "130" && all_strings[i + 3] === "pending") {
          //   chat.push({
          //     type: "Tin nhắn đang chờ",
          //     content: all_strings[i + 1],
          //     avatar: all_strings[i + 2],
          //   });
          // }

          // Thu hồi tin nhắn
          if (str_i === "594" && isMsgIdStr(all_strings[i + 1])) {
            const id = all_strings[i + 1];
            const msg = rvdfm_all_msgs.find((c) => c.id === id) || "";

            chat.push({
              type: "Thu hồi",
              msg: msg,
              id: id,
            });
          }
        }

        console.log("Thông tin lọc được:", chat);

        // Lưu vào rvdfm_all_msgs
        const old_length = rvdfm_all_msgs.length;
        for (let c of chat) {
          let isDuplicated = false;
          for (let r of rvdfm_all_msgs) {
            if (JSON.stringify(c) === JSON.stringify(r)) {
              isDuplicated = true;
              break;
            }
          }

          if (!isDuplicated) {
            rvdfm_all_msgs = rvdfm_all_msgs.concat(chat);

            if (c.type === "Thu hồi") {
              log.text(
                `> Tin nhắn thu hồi: (${c.msg?.type || "Không rõ loại"})`,
                "black",
                "#f35369"
              );
              console.log(
                c.msg || "(RVDFM: không có dữ liệu cho tin nhắn này)"
              );

              sendDeletedMsgToContentJs(c.msg);
            }
          }
        }

        // Hiển thị thông tin lưu tin nhắn mới
        const new_lenght = rvdfm_all_msgs.length;
        const new_msg_count = new_lenght - old_length;
        if (new_msg_count) {
          sendCounterToContentJs(new_msg_count, new_lenght);
          log.text(
            `> RVDFM Đã lưu ${new_msg_count} tin nhắn mới! (${new_lenght})`,
            "green"
          );
        }
      }
    });

    return websocket_instant;
  };

  // Giữ nguyên prototype chỉ đổi constructor thành fake constructor
  window.WebSocket.prototype = original_WebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;
  // #endregion
})();
