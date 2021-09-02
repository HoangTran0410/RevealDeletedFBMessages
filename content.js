// ============================= inject websocket code ============================
var inject_ws_script = document.createElement("script");
inject_ws_script.src = chrome.extension.getURL("./inject_websocket.js");

// Sau khi thêm vào DOM và chạy xong code thì tự xóa dấu vết
inject_ws_script.onload = function () {
  this.parentNode.removeChild(this);
};

// // Bắt đầu thêm vào DOM
let doc = document.body || document.head || document.documentElement;
doc.appendChild(inject_ws_script);

// ========================== Utils ==========================
// Inject extension id: https://stackoverflow.com/a/34414568
var extIdScript = document.createElement("script");
extIdScript.textContent =
  "const rvdfmExtensionId = " + JSON.stringify(chrome.runtime.id);
doc.appendChild(extIdScript);
extIdScript.parentNode.removeChild(extIdScript);

window.addEventListener("load", () => {
  // https://dev.to/paulasantamaria/chrome-extensions-making-changes-to-a-web-page-1n5f
  const icon32 = chrome.runtime.getURL("icons/icon32.png");
  // const icon32 = "icons/icon32.png";

  // Swal.fire({
  //   toast: true,
  //   position: "bottom-end",
  //   iconHtml: `<img src="${icon32}" alt="rvdfm floating modal" />`,
  //   html: `<p><b style="color:blue">RVDFM</b> - Xem tin nhắn bị gỡ trên Facebook <b style="color: green">ĐANG BẬT</b></p>`,
  //   showConfirmButton: true,
  //   timerProgressBar: true,
  //   timer: 5000,
  // });

  document.body.insertAdjacentHTML(
    "beforeend",
    `
    <div id="rvdfm-floating-modal">
        <div id="rvdfm-floating-modal-header">
            <div id="rvdfm-floating-modal-header-icon-container">
                <img src="${icon32}" alt="rvdfm floating modal" title="Kéo thả" />
                <span id="rvdfm-deleted-count-badge" class="badge">0</span>
                <span id="rvdfm-saved-count-badge" class="badge">0</span>
            </div>
            <div id="rvdfm-floating-modal-header-right">
                <p>
                    Đã lưu: <span id="rvdfm-saved-count">0</span> tin nhắn
                    <button id="rvdfm-saved-what" class="rvdfm-question-btn" title="Đây là gì?">?</button>
                </p>
                <p>
                    Phát hiện <span id="rvdfm-deleted-count">0</span> tin thu hồi
                    <button id="rvdfm-deleted-what" class="rvdfm-question-btn" title="Đây là gì?">?</button>
                </p>
            </div>
        </div>
        <div id="rvdfm-deleted-container">
          <div id="rvdfm-deleted-list">
          </div>
          <button id="rvdfm-clear-deleted-list-btn">Xóa tin thu hồi</button>
          <button id="rvdfm-deleted-list-what" class="rvdfm-question-btn"  title="Đây là gì?">?</button>
        </div>
    </div>
`
  );

  // get DOMs
  const floating_modal = document.querySelector("#rvdfm-floating-modal");
  const saved_what_btn = document.querySelector("#rvdfm-saved-what");
  const deleted_what_btn = document.querySelector("#rvdfm-deleted-what");
  const saved_count_span = document.querySelector("#rvdfm-saved-count");
  const saved_count_badge = document.querySelector("#rvdfm-saved-count-badge");
  const deleted_count_span = document.querySelector("#rvdfm-deleted-count");
  const deleted_count_badge = document.querySelector(
    "#rvdfm-deleted-count-badge"
  );
  const deleted_list_container = document.querySelector(
    "#rvdfm-deleted-container"
  );
  const deleted_list_div = document.querySelector("#rvdfm-deleted-list");
  const clear_deleted_list_btn = document.querySelector(
    "#rvdfm-clear-deleted-list-btn"
  );
  const deleted_list_what_btn = document.querySelector(
    "#rvdfm-deleted-list-what"
  );

  // global variables
  let deleted_count = 0;
  let stop_saved_counting_up = null;

  // Make floating modal dragable
  dragElement(floating_modal);

  // restore position (if needed)
  const saved_position = localStorage.rvdfm_floating_modal_position?.split(",");
  if (saved_position) {
    floating_modal.style.top = saved_position[0];
    floating_modal.style.left = saved_position[1];
  }

  // Button Events
  saved_what_btn.onclick = () => {
    Swal.fire({
      icon: "question",
      title: "RVDFM lưu tin nhắn như thế nào?",
      html: `
        <p>Khi bạn mở khung chat với ai đó, FB sẽ gửi tin nhắn về, RVDFM sẽ bắt lấy và lưu lại.</p>
        <p>Số lượng tin nhắn lưu được sẽ hiển thị ở huy hiệu màu <span style="color:steelblue">XANH DƯƠNG</span></p>
        <p>Tin nhắn sẽ được <b>lưu vào máy của bạn</b> (localStorage). Không bị gửi đi đâu hết nhé.</p>
        <p>Có thể lưu tối đa tới 5MB, tương đương hàng triệu tin nhắn.</p>
        <p>Nếu muốn <b>XÓA HẾT</b> những tin đã lưu: ấn <b>F12</b> > vào <b>Console</b> > gõ <b>rvdfm_clear()</b> > <b>Enter</b>.</p>
        <p>Nếu muốn <b>XEM</b> những tin đã lưu: ấn <b>F12</b> > vào <b>Console</b> > gõ <b>rvdfm_all_msgs</b> > <b>Enter</b>.</p>
      `,
      grow: "row",
    });
  };

  deleted_what_btn.onclick = () => {
    Swal.fire({
      icon: "question",
      title: "Làm sao RVDFM biết được nội dung tin nhắn bị thu hồi?",
      html: `
        <p>Khi có ai đó <b>gỡ tin nhắn</b>, RVDFM <b>đối chiếu mã</b> tin nhắn với <b>những tin đã lưu</b>.</p>
        <p>Nếu <b>có trong dữ liệu lưu</b>. RVDFM sẽ hiển thị nội dung tin nhắn đã được lưu.</p>
        <p>Nếu không có dữ liệu, nghĩa là RVDFM <b>chưa kịp lưu</b> nội dung tin đó để hiển thị cho bạn.</p>
        <p>Do vậy, nếu muốn lưu đoạn chat với ai, hãy mở khung chat và đọc tin nhắn của người đó.</p>
        <p>Số lượng tin nhắn thu hồi sẽ hiển thị ở huy hiệu màu <span style="color:red">ĐỎ</span></p>
      `,
      grow: "row",
    });
  };

  deleted_list_what_btn.onclick = () => {
    Swal.fire({
      icon: "question",
      title: "Xóa tin thu hồi là như thế nào?",
      html: `
        <p>Khi đã xem được tin nhắn thu hồi, và muốn ẩn nó đi, bạn có thể bấm Xóa tin thu hồi.</p>
        <p>RVDFM sẽ xóa những tin trong khung, giúp khung gọn gàng, dễ nhìn hơn.</p>
        <p>Thông tin về tin nhắn thu hồi vẫn còn lưu dưới localStorage.</p>
        <p>Nếu bạn muốn đọc hoặc xóa hết tin nhắn dưới localStorage, hãy đọc dấu ? ở mục "Đã lưu ... tin nhắn".</p>
      `,
      grow: "row",
    });
  };

  clear_deleted_list_btn.onclick = () => {
    deleted_count = 0;
    deleted_list_div.innerHTML = "";
    deleted_count_badge.innerHTML = "0";
    deleted_count_span.innerHTML = "0";
    deleted_list_container.style.display = "none";
  };

  // ================================= WINDOW EVENTS ============================
  // Custom event for communication between content.js & background.js: https://stackoverflow.com/a/25847017
  window.addEventListener(
    "rvdfmPassToBackground",
    function (evt) {
      chrome.runtime.sendMessage(evt.detail);
    },
    false
  );

  const getNow = () => new Date().toLocaleTimeString();

  // Show saved counter
  window.addEventListener(
    "rvdfmSavedCounter",
    function (evt) {
      const { count, newLength } = evt.detail;
      const currentValue = Number(saved_count_span.innerText) || 0;

      saved_count_span.innerText = newLength;

      stop_saved_counting_up && stop_saved_counting_up();
      stop_saved_counting_up = animateValue(
        saved_count_badge,
        currentValue,
        newLength,
        Math.min((newLength - currentValue) * 5, 1000)
      );
    },
    false
  );

  // Show deleted msg
  window.addEventListener(
    "rvdfmDeletedMsg",
    function (evt) {
      const msgs = evt.detail;

      const newValue = deleted_count + msgs.length;
      deleted_count_span.innerText = newValue;
      deleted_count_badge.innerText = newValue;
      deleted_count = newValue;

      for (let msg of msgs) {
        let str = `<p>Tin nhắn thu hồi lúc (${getNow()}): </p>
        <span>(${msg?.type?.toLowerCase() || "không rõ"})</span>: `;

        switch (msg.type) {
          case "Chữ":
            let preventXSS = document.createElement("span");
            preventXSS.innerText = msg.content;
            deleted_list_div.insertBefore(
              preventXSS,
              deleted_list_div.firstChild
            );
            break;
          case "Hình ảnh":
          case "Nhãn dán":
            str += `
        <div>
          <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
          <img src="${msg.content}" />
        </div>`;
            break;
          case "GIF":
          case "Video":
            str += `
        <div>
          <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
          <video controls src="${msg.content}" />
        </div>`;
            break;
          case "Âm thanh":
            str += `
        <div>
          <a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>
          <audio controls src="${msg.content}">
              Your browser does not support the <code>audio</code> element.
          </audio>
        <div>`;
            break;
          case "Đính kèm":
          case "Chia sẻ":
            str += `<a href="${msg.content}" target="_blank">Mở trong tab mới</a> <br/>`;
            break;
          default:
            str += "(RVDFM Không có dữ liệu cho tin nhắn này)";
        }

        // append to firstc
        const old = deleted_list_div.innerHTML;
        deleted_list_div.innerHTML = str + old;
      }

      deleted_list_div.insertBefore(
        document.createElement("hr"),
        deleted_list_div.firstChild
      );
      deleted_list_container.style.display = "block";
    },
    false
  );
});

// ========================= Dragable div ===============================
// https://www.w3schools.com/howto/howto_js_draggable.asp
function dragElement(elmnt) {
  var pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.screenX;
    pos4 = e.screenY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.screenX;
    pos2 = pos4 - e.screenY;
    pos3 = e.screenX;
    pos4 = e.screenY;
    // set the element's new position:
    elmnt.style.top = elmnt.offsetTop - pos2 + "px";
    elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;

    // Save position to localstorage
    localStorage.rvdfm_floating_modal_position = `${elmnt.style.top},${elmnt.style.left}`;
  }
}

// https://css-tricks.com/animating-number-counters/
function animateValue(obj, start, end, duration) {
  let startTimestamp = null;
  let step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);

  return () => {
    step = () => {};
  };
}
