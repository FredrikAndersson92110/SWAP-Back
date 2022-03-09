const UserModel = require("../models/users");
const CategoryModel = require("../models/categories");
const RequestModel = require("../models/requests");

var express = require("express");
var router = express.Router();

const request = require("sync-request");

const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { findOne } = require("../models/users");

//! SIGN-UP - en POST
router.post("/sign-up", async (req, res) => {
  console.log("email :", req.body.email);

  const { firstName, lastName, email, password } = req.body;
  //Allready registered ?
  let foundUser = await UserModel.findOne({ email: email });

  if (
    (!foundUser && firstName !== "undefined") ||
    lastName !== "undefined" ||
    password !== "undefined"
  ) {
    //Save user
    const saltRounds = 10;
    const hash = bcrypt.hashSync(password, saltRounds);

    let newUser = new UserModel({
      token: uid2(32),
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: hash,
      insert_date: new Date(),
      user_credit: 1,
    });
    let savedUser = await newUser.save();
    res.json({ status: true, user: savedUser });
  } else if (foundUser) {
    res.json({ status: false, message: "Email déjà utilisé" });
  } else if (
    email == "undefined" ||
    firstName == "undefined" ||
    lastName == "undefined" ||
    password == "undefined"
  ) {
    res.json({ status: false, message: "Vous devez remplir tous les champs" });
  }
});

//! SIGN-IN - en POST
router.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;
  console.log("email", email);
  let foundUser = await UserModel.findOne({ email: email });

  if (foundUser) {
    if (bcrypt.compareSync(password, foundUser.password)) {
      res.json({ status: true, user: foundUser });
    } else {
      res.json({ status: false, message: "Mot de passe ou email incorrects" });
    }
  } else {
    res.json({
      status: false,
      message: "Mot de passe ou email incorrects, créer un compte",
    });
  }
});

//! MOREINFO - en POST
router.post("/more-info", async (req, res) => {
  const { token, birth_date, gender, categories } = req.body;

  let currentUser = await UserModel.findOne({ token: token });
  birth_date !== "" ? (currentUser.birth_date = new Date(birth_date)) : null;
  gender !== "" ? (currentUser.gender = gender) : null;
  for (let catId of categories) {
    currentUser.categories.push(catId);
  }

  await currentUser.save((err) => {
    if (!err) {
      res.json({ status: true, user: currentUser });
    } else {
      res.json({ status: false, message: "une erreur s'est produite" });
    }
  });
});

//! Mettre à jour les adresses via un numéro de token - en PUT
router.put("/adress/:token", async (req, res) => {
  const { token } = req.params;
  let updateUser = await UserModel.updateOne({ token: token });
  console.log("result find ==>", updateUser);
  (user.address_street_1 = req.body.address_street_1),
    (user.address_zipcode = req.body.address_zipcode);

  res.json({ user: updateUser });
});

//Recupérer les infos d'un User grace à un numéro de token
router.get("/get-user/:token", async (req, res) => {
  const { token } = req.params;
  let currentUser = await UserModel.findOne({ token: token });
  console.log("result find ==>", currentUser);
  res.json({ user: currentUser });
});

//! Mettre à jour les asker_status et helper_status via leur user ID - en PUT
router.put("/update-status/:request_id/:token", async (req, res) => {
  const { request_id, token } = req.params;

  let findUser = await UserModel.findOne({ token: token });


  if (findUser) {
    let findRequest = await RequestModel.findById(request_id)
    .populate("asker")
    .populate("conversations")
    .populate({
      path: "conversations",
      populate: {
        path: "conversation_id",
        model: "users",
      },
    });
    console.log('findrequest:', findRequest)
    findRequest.asker_status = 1;
    findRequest.helper_status = 1;
    findRequest.helper = findUser._id;

    var updated = await findRequest.save();


    let foundConversation = findRequest.conversations.find(
      (conversation) => conversation.conversation_id.token === findUser.token
    );
      console.log('foundConversation:', foundConversation)
    let data = {
      ...foundConversation,
      category: updated.category,
      requestId: updated._id,
      asker: updated.asker,
      request: updated,
    };

    res.json({ status: true, updatedRequest: data });
  } else {
    res.json({ status: false, message: "oupsy!" });
  }

});

// await UserModel.updateOne(
//   { lastname: "doe"},
//   { email: "john@doe.fr" }
// );

module.exports = router;
