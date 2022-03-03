const mongoose = require("mongoose");

let categorySchema = mongoose.Schema({
  category: String,
  sub_category: String,
  suggestion: Boolean,
});

let CategoryModel = mongoose.model("categories", categorySchema);

module.exports = CategoryModel;
