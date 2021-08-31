$(document).ready(function () {
  var dataSet = [
    ["1", "14:17 30/08/2021", "14:17 30/08/2021", "Hoang", "Hello"],
  ];

  $("#example").DataTable({
    dom: 'B<"clear">lfrtip',
    data: dataSet,
    columns: [
      { title: "#" },
      { title: "Xóa lúc" },
      { title: "Gửi lúc" },
      { title: "Người gửi" },
      { title: "Nội dung" },
    ],
    columnDefs: [
      {
        targets: 2,
        render: function (data) {
          console.log(data);
          return '<img src="' + data + '">';
        },
      },
    ],
    language: {
      search: "Tìm kiếm",
      searchPlaceholder: "",
      lengthMenu: "Hiển thị _MENU_ dòng / trang",
      zeroRecords: "Không tìm thấy",
      info: "Trang _PAGE_ / _PAGES_",
      infoEmpty: "Từ lúc cài extension này chưa có tin nhắn nào bị gỡ",
      infoFiltered: "(lọc theo _MAX_ total records)",
      paginate: {
        first: "<<",
        last: ">>",
        next: ">",
        previous: "<",
      },
    },
  });
});