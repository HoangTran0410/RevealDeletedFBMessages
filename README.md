# Reveal Deleted FB Messages

[Bài viết Facebook](https://www.facebook.com/groups/j2team.community/posts/1650049605327153/)

Một extension nho nhỏ, giúp mọi người xem lại những tin nhắn đã bị đối phương xóa trong fb messenger.

- Hỗ trợ 2 trang web [facebook.com](https://www.facebook.com) và [messenger.com](https://www.facebook.com)

- Hỗ trợ xem cả link *Hình Ảnh* đã gỡ

- Hiện tại chỉ hiển thị tin nhắn bị xóa trong **console** của trình duyệt

- Extension đang trong giai đoạn phát triển, còn nhiều lỗi vặt

- Hiện chưa up lên store (mất 5$ á :)) ) Khi nào hoàn thiện hơn, nếu có tiền sẽ up lên cho mọi người dễ xài :)

### Ý tưởng và Tham khảo code từ [KB2A Tool](https://kb2atool.com/)


---


## Tự tạo 1 extension xem lại tin nhắn bị gỡ trên fb messenger

Chào mọi người, lại là mình đây.

Hôm qua lướt fb thấy [bài viết](https://www.facebook.com/KB2A.Team/posts/344823077177578) (đã cũ) thông báo ra phiên bản mới của [KB2A Tool](https://kb2atool.com/). Cũng nghe danh lâu nên hào hứng vô tải về xài thử, mới thấy extension này nó nặng **hơn trăm MB** ạ 😢 Không hiểu code gì mà code nặng thế, sự tò mò nó nổi lên, thế là vào xem code, xem nó hoạt động thế nào…

Sau vài đường google (*gần chục tiếng*), cuối cùng mình đã hiểu phần nào cách hoạt động của chức năng xem tin nhắn đã gỡ trên fb rồi. Mà cái gì hay với lạ thì lạ muốn chia sẻ với mọi người 😁

Source code của extension KB2A Tool thì chắc chắn là mấy bạn dev trong team đó đã nén hết rồi, nên việc tìm hiểu code mới mất nhiều thời gian như vậy. Dưới đây mình sẽ nói tổng quan về cách hoạt động của extension và cách tìm hiểu, cách làm từng bước nhé.

P/s: Bài viết này mình viết dựa trên tinh thần chia sẻ kiến thức, chứ mình không quảng cáo hay chê bai gì extension KB2ATool nha. Nếu thích mọi người có thể tải về xài ủng hộ mấy bạn ấy nha, tool đó có nhiều chức năng lắm không chỉ mỗi xem tin nhắn đã gỡ đâu, và cũng có giao diện đẹp nữa. ❤️


## OK LET’S GO.

### Sơ lược cách hoạt động của extension

1. Lưu hết tin nhắn
Mình sẽ tạo 1 script, **chèn script** nó vào trang facebook, script sẽ **lắng nghe mọi sự kiện** gừi/nhận tin nhắn, và **lưu lại nội dung tin nhắn kèm theo id** của tin nhắn đó. 

2. Kiểm tra tin nhắn cũ
Kèm theo đó, mỗi khi có sự kiện tin nhắn mới, mình sẽ **kiểm tra** xem trong danh sách đã lưu có thằng nào **giống id** với sự kiện mới này không. Nếu có thì (rất có thể) đây là sự kiện thu hồi tin nhắn. => **XUẤT RA TIN NHẮN ĐƯỢC THU HỒI**

Để hiểu chi tiết cách làm, mọi người đọc tiếp nhé ❤️

## Cách hoạt động của tin nhắn trong fb:

Để có thể gửi nhận tin nhắn trong thời gian thực, FB không dùng những loại request GET PUT bình thường như fetch, ajax, axios, … Mà nó dùng 1 cấu trúc khác, đó là **WebSocket** ([là gì?](https://topdev.vn/blog/socket-la-gi-websocket-la-gi/)), cung cấp khả năng **giao tiếp thời gian thực** giữa client và server, và có thể là giữa các client với nhau nữa..

Nếu mọi người vào **devtool** của trình duyệt, vào tab **Network** và lọc request theo **WS** (websocket) thì sẽ thấy được những kết nối websocket được dùng bởi FB. FB có nhiều kết nối websocket, trong đó thằng dành cho tin nhắn có tên mở đầu là **chat?region=….**. Bấm vào ta sẽ thấy được mọi **luồng dữ liệu tới và đi** trong kết nối websocket ấy.


## Phân tích dữ liệu tin nhắn

Có rất **nhiều luồng dữ liệu** tới và đi trong websocket chat này, nếu chúng ta thử gửi 1 tin cho người khác, nó sẽ tạo 1 luồng gửi đi, còn người khác gửi cho mình, sẽ có 1 luồng gửi về.

Dữ liệu trong mỗi luồng mặc định hiển thị dưới dạng **base64**, chúng là có thể chuyển về **utf8** để dễ đọc hơn (thấy nó giống chuỗi json hơn thôi chứ vẫn khó đọc lắm 😂).  

Nếu tìm kỹ chúng ta sẽ thấy được nội dung tin nhắn, và thật may là **không bị mã hóa** gì khác nữa cả 🥸. OKE tiếp theo để cho tiện thì ta tạo 1 regex giúp ta lấy được đoạn tin nhắn đó ra khỏi chuỗi dữ liệu, mình dùng web [regexr.com](https://regexr.com/) để tạo regex cho lẹ.

**~ 2 thousand years later ....** 

Phải đi học lại khóa regex mới được 😢😢😢

**YAY** đã lấy được nội dung tin nhắn ra khỏi luồng dữ liệu rồi. Giờ để mọi thứ được tự động, hãy **tạo extension**.


## Tạo extension

Mình tìm hiểu cách làm extension ở [topdev](https://topdev.vn/blog/cach-build-chrome-extension/) kết hợp với ngẫm code của KB2A Tool.

Vấn đề chính bây giờ đó là làm sao để có thể **lắng nghe websocket** của fb. Mỗi biến websocket được tạo ra sẽ là 1 biến local riêng biệt, không phải biến toàn cục, **không thể truy cập được từ bên ngoài**.

Sau khi tu luyện bằng source code KB2A Tool, thì mình đã tìm ra chân lý. Mấy bạn ấy tạo 1 đoạn **script**, và cho nó **chạy trước** khi trang fb chạy (run at document_start). 
Đoạn script này sẽ tạo ra 1 biến window.WebSocket **GIẢ**, trong đó **chèn code lắng nghe sự kiện**. 

Khi trang facebook bắt đầu chạy, nó sẽ **dùng thằng GIẢ** này để tạo biến websocket local cho riêng nó để dùng. Nhưng do đã bị **LÀM GIẢ** từ trước, nên trong biến local đó đã có sẵn code lắng nghe sự kiện của ta. **BÙMMM** 😂😂🤯🤯

Vậy là mọi ý tưởng đã hoàn thành. Mình đã thực hiện và chia sẻ source code với mọi người tại [github](https://github.com/HoangTran0410/RevealDeletedFBMessages)

p/s: Mình sẽ thêm ảnh từng bước và hướng dẫn chi tiết trong từng ảnh nhé..