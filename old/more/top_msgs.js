// Code lấy Top tin nhắn (những người nhắn tin nhiều nhất với mình)
// Copy ra từ code của KB2ATool
// Chưa xử lý, ko biết chạy được hay không nha :)

// PHỤC VỤ CHO MỤC ĐÍCH CHIA SẺ KIẾN THỨC. TUYỆT ĐỐI KHÔNG ĂN CẮP BẢN QUYỀN SỬ DỤNG ĐỂ THU LỢI NHUẬN

(async () => {
  // Láy token fb
  console.log("Đang lấy token ...");
  const { token, fb_dtsg } = await (async () => {
    const response = await fetch(
      "https://m.facebook.com/composer/ocelot/async_loader/?publisher=feed"
    );

    const text = await response.text();

    // Nếu có ký tự < ở đầu => chưa đăng nhập
    if ("<" == text[0]) console.error("Chưa đăng nhập");

    return {
      token: /(?<=accessToken\\":\\")(.*?)(?=\\")/.exec(text)[0],
      fb_dtsg: /(?<=fb_dtsg\\" value=\\")(.*?)(?=\\")/.exec(text)[0],
      id: /(?<="uid\\":).*?(?=,\\")/gm.exec(text)[0],
    };
  })();
  console.log("fb_dtsg: ", fb_dtsg);

  // Dùng token để lấy thông tin tin nhắn thông qua fb API
  console.log("Đang lấy dữ liệu tin nhắn ...");
  const chatData = await (async () => {
    const response = await fetch("https://www.facebook.com/api/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fb_dtsg: fb_dtsg,
        q: "viewer(){message_threads{nodes{thread_key{thread_fbid,other_user_id},all_participants{nodes{messaging_actor{name,gender,profile_picture}}},messages_count,name,image,thread_type}}}",
      }),
    });

    console.log(response);

    // Dữ liệu trả về từ fb API
    const json = await response.json();

    console.log(json);
    const data = json.viewer.message_threads.nodes;

    console.log("Đang phân tích dữ liệu tin nhắn ....");
    const chatData = data.map((t) => {
      // Tin nhắn riêng tư
      if ("ONE_TO_ONE" == t.thread_type) {
        return {
          messages_count: t.messages_count,
          other_user_id: t.thread_key.other_user_id,
          name: t.all_participants.nodes[0].messaging_actor.name,
          image: `https://graph.facebook.com/${t.thread_key.other_user_id}/picture?width=200&height=200&access_token=${n}`,
          type: "Riêng tư",
        };
      }

      // Tin nhắn trong nhóm
      else if ("GROUP" == t.thread_type) {
        return {
          messages_count: t.messages_count,
          other_user_id: t.thread_key.thread_fbid,
          name: t.name,
          image: t.image?.uri,
          type: "Nhóm",
        };
      }
    });

    // Sắp xếp theo messages_count
    console.log("Đang sắp xếp tin nhắn ...");
    chatData.sort((t, e) => e.messages_count - t.messages_count);
  })();

  // XUẤT RA CONSOLE
  console.log(chatData);
})();
