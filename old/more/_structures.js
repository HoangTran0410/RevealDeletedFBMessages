const msg_structure = {
  id: "$mid....", // required
  type: "text | image | video", // optional
  content: "text | urls", // optional
  sender: "who sent this msg", // optional
  createdAt: "when this msg is created (received)", // required
};

const event_structure = {
  event_type: "new_msg | del_msg",
  createdAt: 'when this event created',
  msgData: msg_structure,
};

const localStorage_structure = {
  deleted: {
    msg_id1: {
      msg_id: "id",
      deletedAt: "deleted at",
    },
  },
  all: {
    msg_id: msg_structure,
  },
};
