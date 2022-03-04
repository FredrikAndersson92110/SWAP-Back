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
  // console.log("INFOS REÇUES BACK ==> :", req.body);
  
  console.log("L27 BACK : EMAIL AVANT SAVE DB", req.body.email);
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
  let categoriesArray = categories.split(",");
  let categories_ID = [];

  //RECHERCHE DES CLES ETRANGERES DES CATEGORIES DANS LA DB
  for (let i = 0; i < categoriesArray.length; i++) {
    let foundCategory = await CategoryModel.findOne({
      category: categoriesArray[i],
    });
    //Ajout des clés étrangère dans un tableau pour les enregistrer ensuite sur la DB
    categories_ID.push(foundCategory._id);
  }
console.log("L43 BACK : EMAIL AVANT SAVE DB", email);

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
      birth_date: birth_date,
      gender: gender,
      categories: categories_ID,
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
// router.put('/updateAdress/:token', async (req,res) => {
//   let updateUser = await UserModel.updateOne({token: token});
//   console.log("result find ==>", updateUser);
//   user.address_street_1 = req.body.address_street_1,
//   user.address_zipcode = req.body.address_zipcode
  
//   res.json({ user: updateUser });
// })

router.put('/updateAdress/:token', async(req, res)=> {
  
 
  let result = await UserModel.findOne(req.params.token)
  if (!result) {
    res.status(404).send("data is not found");
  }
  else {
      result.address_street_1 = req.body.address_street_1;
      result.address_zipcode = req.body.address_zipcode;
      result.updateOne();
  }
});



//Recupérer les infos d'un User grace à un numéro de token
router.get("/get-user/:token", async (req, res) => {
  const { token } = req.params;
  let currentUser = await UserModel.findOne({ token: token });
  res.json({ user: currentUser });
});

//Vérifie si mail existe déjà
router.get("/check-email", async (req, res) => {

  let emailExist = await UserModel.findOne({ email: req.query.email });
  if (emailExist == null) {
    res.json({ result: false });
  } else if (emailExist !== null) {
    res.json({ result: true, message: "Email déjà utilisé" });
  }
});

module.exports = router;
