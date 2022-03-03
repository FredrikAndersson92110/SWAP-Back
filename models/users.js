const mongoose = require("mongoose");
let userAddressSchema = mongoose.Schema({
  address_street_1: String,
  address_street_2: String,
  address_zipcode: String,
  address_city: String,
  address_country: String,
});

let commentsSchema = mongoose.Schema({
  author: String,
  content: String,
  insert_date: Date,
});

let userSchema = mongoose.Schema({
  token: String,
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  birth_date: Date,
  insert_date: Date,
  gender: {
    type: String,
    enum: ["male", "female", "non-binary"],
  },
  user_img: String,
  user_credit: Number,
  description: String,
  disponibility: String,
  verified_profile: Boolean,
  comments: [commentsSchema],
  userAddresses: [userAddressSchema],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: "categories" }],
});

let UserModel = mongoose.model("users", userSchema);

module.exports = UserModel;
