(function () {
  console.log("hello from You Can't Hide Your Message");

  // Lưu tất cả tin nhắn, và những tin nhắn bị gỡ
  const all_msgs = {};
  const deleted_msgs = {};

  // Hàm decode data websocket về tiếng việt, loại bỏ những thằng \\
  const parse = (str) => {
    let ret = str;
    let limit = 10;
    while (--limit > 0) {
      try {
        ret = JSON.parse(`"${ret}"`);
      } catch (e) {
        break;
      }
    }
    return ret;
  };

  // Lưu lại webSocket gốc của browser
  const original_WebSocket = window.WebSocket;

  // Tạo 1 fake webSocket constructor - facebook sẽ gọi hàm này để tạo socket
  window.WebSocket = function fakeConstructor(dt, config) {
    const websocket_instant = new original_WebSocket(dt, config);

    // Chèn event on message => để bắt tất cả event được dùng bởi facebook trong webSocket
    websocket_instant.addEventListener("message", async function (achunk) {
      // chuyển binary code của websocket về string utf8
      const utf8_str = new TextDecoder("utf-8").decode(achunk.data);

      // nếu đầu string có ký tự 1, 2 hoặc 3 => đây chính là socket tin nhắn
      // socket ký tự 3 liên quan tới tin nhắn từ người khác gửi/xóa tới mình
      // socket ký tự 1 được dùng bởi event xóa tin nhắn trong nhóm chat (và nhiều event khác ngoài tin nhắn ???)
      if (utf8_str[0] === "3" || utf8_str[0] === "1") {
        const msg_id_regex = /(?=mid\.\$)(.*?)(?=\\",)/;
        const msg_id = utf8_str.match(msg_id_regex);

        if (msg_id?.length) {
          const id = msg_id[0];
          console.log(`\n\nLúc ${new Date().toLocaleString()}: ${id}`);

          // =============================== SIGNAL THU HỒI TIN NHẮN ===============================
          // Nếu id của tin nhắn này đã có trong all_msg
          // => (Rất Có thể) là event Thu hồi

          if (all_msgs[id] != null) {
            deleted_msgs[id] = all_msgs[id];
            delete all_msgs[id];

            console.log("Tin nhắn đã bị thu hồi: ");

            if (deleted_msgs[id].type === "text") {
              console.log(deleted_msgs[id].content);
            }

            if (deleted_msgs[id].type === "image") {
              deleted_msgs[id].content
                .split(",")
                .forEach((url) => console.log(url));
            }

            return;
          }

          // =============================== TIN NHẮN CHỮ ===============================
          // Tin nhắn chữ sẽ nằm giữa đoạn \"124\\", \\" TỚI \\",undefined
          const text_chat_regex = /(?<=\\"124\\", \\")(.*?)(?=\\",undefined)/;
          const text_content = utf8_str.match(text_chat_regex);

          if (text_content?.length) {
            const msg = parse(text_content[0]);
            console.log(msg);

            // Lưu lại
            all_msgs[id] = {
              type: "text",
              content: msg,
            };

            return;
          }

          // =============================== TIN NHẮN HÌNH ẢNH ===============================
          // Hình ảnh là đoạn bắt đầu bằng https:, kết thúc bằng ",
          const img_chat_regex = /(https)(.*?)(?=\\",)/g;
          const img_content = utf8_str.match(img_chat_regex);

          if (img_content?.length) {
            // decode từng thằng
            let urls = img_content.map((str) => parse(str));

            // Lọc ra những link kích thước nhỏ (có "/s x" hoặc "/p x" trong link)
            const small_img_url_regex = /(s\d+x\d+)|(p\d+x\d+)/g;
            urls = urls.filter(
              (url) => !url.match(small_img_url_regex)?.length
            );

            urls.forEach((url) => console.log(url));

            // Lưu lại
            all_msgs[id] = {
              type: "image",
              content: urls.join(","),
            };

            return;
          }

          // =========== Lấy ra tất cả chuỗi ===========
          // Trường hợp lấy được id tin nhắn, mà ko lấy được chữ hay hình, thì show ra hết chuỗi => dùng để debug
          // Do socket có mã 1 ở đầu được dùng bởi nhiều event khác ngoài nhắn tin, mấy event đó sẽ vô đây !??
          const all_strings_regex = /(\\\")(.*?)(\\\")/g;
          let all_strings = utf8_str.match(all_strings_regex) || [];
          all_strings = all_strings.map((str) => parse(str));
          console.log("> Mọi thông tin: ", all_strings);
        }
      }
    });

    return websocket_instant;
  };

  // Giữ nguyên prototype chỉ đổi constructor thành fake constructor
  window.WebSocket.prototype = original_WebSocket.prototype;
  window.WebSocket.prototype.constructor = window.WebSocket;
})();

// TODO: Cần xem lại socket event, xác định được chính xác điểm khác biệt của các event thì mới tạo regex đúng được