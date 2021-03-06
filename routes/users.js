const UserModel = require("../models/users");
const CategoryModel = require("../models/categories");
const RequestModel = require("../models/requests");

var express = require("express");
var router = express.Router();

const request = require("sync-request");

const uid2 = require("uid2");
const bcrypt = require("bcrypt");
// const { findOne } = require("../models/users");
// const { response } = require("express");

//! SIGN-UP - en POST
router.post("/sign-up", async (req, res) => {
  // console.log("INFOS REÇUES BACK ==> :", req.body);

  const {
    firstName,
    lastName,
    email,
    password,
    birth_date,
    gender,
    categories,
  } = req.body;

  //Allready registered ?
  let foundUser = await UserModel.findOne({ email: email });

  //On passe les catégories de string à array
  // let categoriesArray = categories.split(",");
  // let categories_ID = [];

  // //RECHERCHE DES CLES ETRANGERES DES CATEGORIES DANS LA DB
  // for (let i = 0; i < categoriesArray.length; i++) {
  //   let foundCategory = await CategoryModel.findOne({
  //     category: categoriesArray[i],
  //   });
  //   //Ajout des clés étrangère dans un tableau pour les enregistrer ensuite sur la DB
  //   categories_ID.push(foundCategory._id);
  // }
  // console.log("L43 BACKEND : EMAIL AVANT SAVE DB", email);

  if (
    !foundUser &&
    firstName !== "undefined" &&
    lastName !== "undefined" &&
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
      birth_date: birth_date,
      gender: gender,
      // categories: categories_ID,
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

  //HASHING
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

//! updateAdress - en PUT
router.put("/updateAdress/:token", async (req, res) => {
  const { token } = req.params;

  let result = await UserModel.findOne({ token: token });
  console.log(result);
  if (!result) {
    res.status(404).send("data is not found");
  } else {
    result.userAddresses[0].address_street_1 = req.body.address_street_1;
    result.userAddresses[0].address_city = req.body.address_city;
    result.userAddresses[0].address_zipcode = req.body.address_zipcode;

    await result.save();
    res.json(result);
  }
});

//! GET-USER - en GET
//Recupérer les infos d'un User grace à un numéro de token
router.get("/get-user/:token", async (req, res) => {
  const { token } = req.params;
  let currentUser = await UserModel.findOne({ token: token });
  res.json({ user: currentUser });
});

//! CHECK-EMAIL - en GET
//Vérifie si mail existe déjà
router.get("/check-email", async (req, res) => {
  let emailExist = await UserModel.findOne({ email: req.query.email });
  if (emailExist == null) {
    res.json({ result: false });
  } else if (emailExist !== null) {
    res.json({ result: true, message: "Email déjà utilisé" });
  }
});

router.get("/test", (req, res) => {
  res.json({ status: true, message: "pass!" });
});

router.post("/test", (req, res) => {
  let firstName = req.body.firstName;

  res.json({ nom: firstName });
});

module.exports = router;
