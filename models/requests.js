const mongoose = require("mongoose");

let messageSchema = mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  message: String,
  insert_date: Date,
});

let conversationSchema = mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  messages: [messageSchema],
});

let requestSchema = mongoose.Schema({
  asker_status: Number,
  helper_status: Number,
  category: { type: mongoose.Schema.Types.ObjectId, ref: "categories" },
  description: String,
  insert_date: Date,
  confirmation_date: Date,
  end_date: Date,
  credit: Number,
  helper: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  asker: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  selected_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  willing_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  accepted_users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  conversations: [conversationSchema],
});

let RequestModel = mongoose.model("requests", requestSchema);

module.exports = RequestModel;
