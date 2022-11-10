(function () {
  console.log("Extension RVDFM - Xem Tin Nhắn Bị Gỡ Trên FB đã BẬT");

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

  const original_WebSocket = window.WebSocket;

  window.WebSocket = function fakeConstructor(dt, config) {
    const websocket_instant = new original_WebSocket(dt, config);

    const isMsgIdStr = (str) => str?.startsWith("mid.$");
    const isLink = (str) => str?.startsWith("https://");

    websocket_instant.addEventListener("message", async function (achunk) {
      const utf8_str = new TextDecoder("utf-8").decode(achunk.data);

      if (utf8_str[0] === "1" || utf8_str[0] === "2" || utf8_str[0] === "3") {
        const have_msg_id = /(?=mid\.\$)(.*?)(?=\\")/.exec(utf8_str);

        if (!have_msg_id) {
          const users_data = [];

          const user_data_zones =
            /(?=\(LS.sp\(\\"25\\")(.*?)(?=:LS.resolve)/gm.exec(utf8_str);

          if (user_data_zones != null) {
            user_data_zones.forEach((zone) => {
              const user_id = /(?<=\?entity_id=)(.*?)(?=\&entity_type)/.exec(
                zone
              );
              const avatars = /(?=https)(.*?)(?=\\",)/g.exec(zone);
              const small_avatar = parse(avatars[0]);
              const big_avatar = parse(avatars[1]);

              const user_msg_id = /(?<=, )(.*?)(?=,\[0,1\],)/gm.exec(zone);
            });
          }

          for (let i = 0; i < all_strings.length; i++) {
            const str_i = all_strings[i];

            // Thông tin người dùng
            if (str_i === "13" && all_strings[i + 1] === "25") {
              const small_avatar = all_strings[i + 2];
              const large_avatar = all_strings[i + 4];
              const user_id = /(?<=\?entity_id=).*?(?=\&entity_type)/.exec(
                all_strings[i + 3]
              )[0];
              const full_user_name = all_strings[i + 6];
              const short_user_name = all_strings[i + 8];
              const unknown_id = all_strings[i + 9];

              // Có những event bắt đầu bằng 13 ,25 nhưng không có user name => loại
              if (full_user_name) {
                users_data.push({
                  user_id,
                  small_avatar,
                  large_avatar,
                  full_user_name,
                  short_user_name,
                  unknown_id,
                });
              }
            }
          }

          if (users_data.length) {
            console.log("Users data: ", "yellow", "black");
            console.log(users_data);
          }

          // Lưu vào rvdfm_all_users
          rvdfm_all_users = rvdfm_all_users.concat(users_data);

          return;
        }

        const all_strings_regex = /(\\\")(.*?)(\\\")(?=[,)])/g;
        let all_strings = utf8_str.match(all_strings_regex) || [];
        all_strings = all_strings.map((str) => parse(str));

        if (all_strings?.length) return;
        const request_id = /(?<=\"request_id\":)(.*?)(?=,)/.exec(utf8_str)[0];
        console.log(
          "RVDFM - VÀO LÚC " + new Date().toLocaleString(),
          "Mọi thông tin: ",
          {
            request_id,
            all: all_strings,
            utf8_str,
          }
        );

        let chat = [];
        for (let i = 0; i < all_strings.length; i++) {
          const str_i = all_strings[i];

          // Tin nhắn chữ
          if (str_i === "insertMessage" && isMsgIdStr(all_strings[i + 2])) {
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
          if (str_i === "insertBlobAttachment" && isLink(all_strings[i + 2])) {
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
          if (
            str_i === "insertMessage" &&
            isMsgIdStr(all_strings[i + 1]) &&
            isLink(all_strings[i + 6])
          ) {
            chat.push({
              type: "Nhãn dán",
              content: all_strings[i + 6],
              id: all_strings[i + 1],
            });
          }

          // Thả react
          if (str_i === "upsertReaction" && isMsgIdStr(all_strings[i + 1])) {
            chat.push({
              type: "Thả react",
              content: all_strings[i + 2],
              id: all_strings[i + 1],
            });
          }

          // Gỡ react
          if (str_i === "deleteReaction" && isMsgIdStr(all_strings[i + 1])) {
            const id = all_strings[i + 1];
            const content =
              rvdfm_all_msgs.find((c) => c.id === id)?.content || "";

            chat.push({
              type: "Gỡ react",
              content: content,
              id: id,
            });
          }

          // Tin nhắn chia sẻ vị trí / vị trí trực tiếp
          if (
            str_i === "xma_live_location_sharing" &&
            isMsgIdStr(all_strings[i - 2]) &&
            isLink(all_strings[i + 1])
          ) {
            const link = all_strings[i + 1];

            chat.push({
              type: "Chia sẻ",
              content: link,
              id: all_strings[i - 2],
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
          if (
            str_i === "deleteThenInsertMessage" &&
            isMsgIdStr(all_strings[i + 2])
          ) {
            const id = all_strings[i + 2];
            const msgs =
              rvdfm_all_msgs.filter(
                (c) => c.id === id && c.type !== "Thu hồi"
              ) || [];

            chat.push({
              type: "Thu hồi",
              msgs: msgs,
              id: id,
            });
          }
        }

        chat = chat.map((_) => ({ ..._, time: Date.now() }));

        console.log("Thông tin lọc được:", chat);

        // Lưu vào rvdfm_all_msgs
        const old_length = rvdfm_all_msgs.length;
        for (let c of chat) {
          let isDuplicated =
            -1 !==
            rvdfm_all_msgs.findIndex(
              (_msg) => JSON.stringify(c) === JSON.stringify(_msg)
            );

          if (!isDuplicated) {
            rvdfm_all_msgs = rvdfm_all_msgs.concat(chat);

            // Tin nhắn thu hồi
            if (c.type === "Thu hồi") {
              const deleted_msg_type = c.msgs
                .map((_c) => c.type || "không rõ loại")
                .join(",");

              console.log(
                `> Tin nhắn thu hồi: (${deleted_msg_type})`,
                c.msgs || "(RVDFM: không có dữ liệu cho tin nhắn này)"
              );

              rvdfmSendDeletedMsgToContentJs(c.msgs);
            }

            // Tin nhắn thả/gỡ react
            else if (c.type == "Thả react" || c.type === "Gỡ react") {
              const target_msg = rvdfm_all_msgs.filter(
                (_msg) => _msg.id === c.id
              );

              console.log(
                `> ${c.type}:`,
                target_msg || "(RVDFM: không có dữ liệu cho tin nhắn này)"
              );
            }
          }
        }

        // Hiển thị thông tin lưu tin nhắn mới
        const new_lenght = rvdfm_all_msgs.length;
        const new_msg_count = new_lenght - old_length;
        if (new_msg_count) {
          rvdfmSendSavedCounterToContentJs(new_msg_count, new_lenght);
          console.log(
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
