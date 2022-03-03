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
    !foundUser &&
    firstName !== "undefined" ||
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
  console.log("email", email)
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

//Recupérer les infos d'un User grace à un numéro de token
router.get("/get-user/:token", async (req, res) => {
  const { token } = req.params;
  let currentUser = await UserModel.findOne({ token: token });
  console.log("result find ==>", currentUser);
  res.json({ user: currentUser });
});

module.exports = router;
