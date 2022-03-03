const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

var options = {
  connectTimeoutMS: 5000,
  useNewUrlParser: true,
  useUnifiedTopology: true,
};
let url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2ozuf.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

mongoose.connect(url, options, function (err) {
  if (!err) {
    console.log("connexion réussie");
  } else {
    console.log(err);
  }
});
