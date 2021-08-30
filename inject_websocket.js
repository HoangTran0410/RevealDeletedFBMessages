(function () {
  console.log("Extension Xem Tin Nhắn Bị Gỡ Trên FB đã BẬT");

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
    text: (str, color = "white", bg = "black") => {
      console.log(`%c${str}`, `color: ${color}; background: ${bg}`);
    },
    image: (url) => {
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
      img.src = url;
    },
  };

  // https://stackoverflow.com/a/18837750
  const isLinkExists = (image_url) => {
    var http = new XMLHttpRequest();
    http.open("HEAD", image_url, false);
    http.send();
    return http.status != 404;
  };

  // https://stackoverflow.com/a/25847017
  const sendToBackgroundPage = (data) => {
    var event = new CustomEvent("rvdfmPassToBackground", {
      detail: { ...data, time: Date.now() },
    });
    window.dispatchEvent(event);
  };
  // #endregion

  //#region ========================================= BẮT ĐẦU HACK :)) =========================================

  // Lưu tất cả tin nhắn, và những tin nhắn bị gỡ
  const all_msgs = {};
  const deleted_msgs = {};

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
        const msg_id_regex = utf8_str.match(/(?=mid\.\$)(.*?)(?=\\")/);

        if (msg_id_regex?.length) {
          const msgid = msg_id_regex[0];
          console.log(`\n\nLúc ${new Date().toLocaleString()}: id=${msgid}`);

          const is_new_msg = utf8_str.includes(`[_=>LS.sp(\\"170\\",`);
          const is_list_msgs = utf8_str.includes(`[_=>LS.sp(\\"130\\",`);
          const is_delete_msg = utf8_str.includes(`[_=>LS.sp(\\"125\\",`);

          //#region =============================== SIGNAL THU HỒI TIN NHẮN ===============================
          // Nếu id của tin nhắn này đã có trong all_msg
          // => (Rất Có thể) là event Thu hồi

          if (is_delete_msg) {
            if (!all_msgs[msgid]) {
              sendToBackgroundPage({
                type: "deleted_unknow_msg",
                msgid: msgid,
              });
            } else {
              deleted_msgs[msgid] = all_msgs[msgid];
              delete all_msgs[msgid];

              sendToBackgroundPage({
                type: "deleted_msg",
                msgid: msgid,
                msg_data: deleted_msgs[msgid],
              });

              log.text("Tin nhắn đã bị thu hồi: ", "red");

              if (deleted_msgs[msgid].type === "text") {
                log.text(deleted_msgs[msgid].content);
              }

              if (deleted_msgs[msgid].type === "image") {
                deleted_msgs[msgid].content
                  .split(",")
                  .forEach((url) => log.image(url));
              }
            }

            return;
          }
          //#endregion

          //#region =============================== TIN NHẮN CHỮ ===============================
          // Tin nhắn chữ sẽ nằm giữa đoạn \"124\\", \\" TỚI \\",
          const text_content_regex = utf8_str.match(
            /(?<=\\"124\\", \\")(.*?)(?=\\",)/
          );

          if (is_new_msg && text_content_regex?.length) {
            const content = parse(text_content_regex[0]);
            log.text(content);

            // Lưu lại
            const save_data = {
              type: "new_msg_text",
              msgid: msgid,
              content: content,
            };
            all_msgs[msgid] = save_data;
            sendToBackgroundPage(save_data);

            return;
          }
          //#endregion

          //#region =============================== TIN NHẮN HÌNH ẢNH/VIDEO ===============================
          // Hình ảnh là đoạn bắt đầu bằng "https VÀ kết thúc bằng "
          const img_contents_regex = utf8_str.match(
            /(https:)(.*?)(\.xx\.fbcdn\.net)(.*?)(?=\\\",)/g
          );

          if (is_new_msg && img_contents_regex?.length) {
            // decode từng thằng
            let urls = img_contents_regex.map((str) => parse(str));

            // Lọc ra những link trùng nhau - https://www.javascripttutorial.net/array/javascript-remove-duplicates-from-array/
            let unique_urls = [...new Set(urls)];

            // Lọc ra những link kích thước nhỏ (có "/s x" hoặc "/p x" trong link)
            // Chỉ lọc khi có nhiều hơn 1 hình
            if (unique_urls.length > 1) {
              unique_urls = unique_urls.filter(
                (url) => !url.match(/(s\d+x\d+)|(p\d+x\d+)/g)?.length
              );
            }

            // Lọc ra những link hỏng
            unique_urls = unique_urls.map((url) => isLinkExists(url));

            unique_urls.forEach((url) => log.image(url));

            // Lưu lại
            const save_data = {
              type: "new_msg_img",
              msgid: msgid,
              content: unique_urls.join(","),
            };
            all_msgs[msgid] = save_data;
            sendToBackgroundPage(save_data);

            return;
          }
          //#endregion

          //#region =========== Lấy ra tất cả chuỗi ===========
          // Trường hợp lấy được id tin nhắn, mà ko lấy được chữ hay hình, thì show ra hết chuỗi => dùng để debug
          // Do socket có mã 1 ở đầu được dùng bởi nhiều event khác ngoài nhắn tin, mấy event đó sẽ vô đây !??
          const all_strings_regex = /(\\\")(.*?)(\\\")/g;
          let all_strings = utf8_str.match(all_strings_regex) || [];
          all_strings = all_strings.map((str) => parse(str));
          console.log("> Mọi thông tin: ", all_strings);
          //#endregion
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
