const UserModel = require("../models/users");
const CategoryModel = require("../models/categories");
const RequestModel = require("../models/requests");

var express = require("express");
var router = express.Router();

const request = require("sync-request");

const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { json } = require("express");

//!  INTERACTION SCREEN - en GET
router.get("/get-matches/:token", async (req, res) => {
  console.log("got fetch");
  const { token } = req.params;
  //get current User
  let currentUser = await UserModel.findOne({ token: token });

  let requests = await RequestModel.find({
    $or: [
      { asker: currentUser._id },
      { helper: currentUser._id },
      { selected_users: currentUser._id },
      { willing_users: currentUser._id },
      { accepted_users: currentUser._id },
    ],
  })
    .populate("asker")
    .populate("helper")
    .populate("accepted_users")
    .populate("willing_users")
    .populate("accepted_users")
    .populate("category")
    .populate("conversations")
    .populate({
      path: "conversations",
      populate: {
        path: "conversation_id",
        model: "users",
      },
    });

  if (requests != 0) {
    res.json({
      status: true,
      requests: requests,
    });
  } else {
    res.json({ status: false, message: "Vous n'avez aucune demande en cours" });
  }
});

//!  ASK SCREEN - en GET
router.get("/get-willing-users/:token", async (req, res) => {
  console.log("got fetch");
  const { token } = req.params;
  //get current User
  let currentUser = await UserModel.findOne({ token: token });

  let requests = await RequestModel.find({
    $and: [{ asker: currentUser._id }, { helper: null }],
  })
    .populate("asker")
    .populate("category")
    .populate("willing_users")
    .populate("accepted_users")
    .populate({
      path: "willing_users",
      populate: {
        path: "categories",
        model: "categories",
      },
    });

  if (requests != 0) {
    res.json({
      status: true,
      requests: requests,
    });
  } else {
    res.json({
      status: false,
      message: "Vous n'avez pas de propsitions pour le moment",
    });
  }
});

router.delete("/delete-willing-user/:reqId/:token", async (req, res) => {
  const { reqId, token } = req.params;

  let foundRequest = await RequestModel.findById(reqId).populate(
    "willing_users"
  );

  if (foundRequest) {
    let willing_users = foundRequest.willing_users.filter(
      (user) => user.token !== token
    );
    foundRequest.willing_users = willing_users;
    let savedRequest = await foundRequest.save();
    res.json({ status: true, request: savedRequest });
  } else {
    res.json({ status: false, request: savedRequestr });
  }
});

//! acceptHelper en PUT
router.put("/accept-helper/:reqId/:token", async (req, res) => {
  const { reqId, token } = req.params;

  let foundRequest = await RequestModel.findById(reqId)
    .populate("willing_users")
    .populate("accepted_users");

  if (foundRequest) {
    let willing_users = foundRequest.willing_users.filter(
      (user) => user.token !== token
    );
    foundRequest.willing_users = willing_users;
    let userToAdd = await UserModel.findOne({ token: token });
    console.log(userToAdd);
    foundRequest.accepted_users.push(userToAdd._id);
    let savedRequest = await foundRequest.save();
    res.json({ status: true, request: savedRequest });
  } else {
    res.json({ status: false, request: savedRequest });
  }
});

//! SUGGESTIONS EN GET
//
// ─── /suggestions EN GET ─────────────────────────────────────────────────────────
// HOME SCREEN : carroussel du Dashbord. (find sur toutes les categories s=dont les suggestions sont à "true")

//! MATCH CATEGORIES
//
// ─── /match-categories ─────────────────────────────────────────────────────────
// HELPS CREEN : route en GET sur catégories, avec fetch en get avec url de la route matchcatgories côté front
// + pastille helper selected ou non [selected_users] du requestSchema

//! addwilling_user
//
// ─── /add-willing-user en PUT ─────────────────────────────────────────────────────────
// DETAIL SCREEN : Je suis helper, quand je click sur ACCEPTER la demande d'aide côté front ==> fetch pour envoyer
// mon ID (qui passe de [willing_user] à [accepted_user]

//! userByCategory en GET
//
// ─── /user-by-category en GET─────────────────────────────────────────────────────────
// LIST REQUEST SCREEN get user qui correspondent à la catégorie demandée

//! addRequest en POST
//
// ─── /add-requests en POST ─────────────────────────────────────────────────────────
// pour envoyer les sélections du LIST REQUEST SCREEN en BDD, ajoute personnes sélectionnées dans [selected_users]
//

// ADD

module.exports = router;
