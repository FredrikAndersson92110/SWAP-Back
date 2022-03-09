const UserModel = require("../models/users");
const CategoryModel = require("../models/categories");
const RequestModel = require("../models/requests");

var express = require("express");
var router = express.Router();

const request = require("sync-request");

const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { json } = require("express");
const { populate, update } = require("../models/users");

//!  INTERACTION SCREEN - en GET
router.get("/get-matches/:token", async (req, res) => {
  console.log("get matches");

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
    })
    .populate({
      path: "conversations.messages",
      populate: {
        path: "author",
        model: "users",
      },
    });

  if (requests.length !== 0) {
    console.log(requests);
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

  let currentUser = await UserModel.findOne({ token: token });

  if (currentUser) {
    let removeWilling = await RequestModel.updateMany(
      { _id: reqId },
      {
        $pull: { willing_users: currentUser._id },
      }
    );
    let updateAccepted = await RequestModel.updateMany(
      { _id: reqId },
      {
        $push: { accepted_users: currentUser._id },
      }
    );

    let updateConversation = await RequestModel.updateMany(
      { _id: reqId },
      {
        $push: {
          conversations: { conversation_id: currentUser._id, messages: [] },
        },
      }
    );

    let foundRequest = await RequestModel.findById(reqId)
      .populate("asker")
      .populate("category")
      .populate("conversations")
      .populate({
        path: "conversations",
        populate: {
          path: "conversation_id",
          model: "users",
        },
      });

    let foundConversation = foundRequest.conversations.find(
      (conversation) => conversation.conversation_id.token === token
    );
    console.log("FOUNDCONV", foundConversation);
    let data = {
      ...foundConversation,
      category: foundRequest.category,
      requestId: foundRequest._id,
      asker: foundRequest.asker,
      request: foundRequest,
    };

    res.json({ status: true, request: data });
  } else {
    res.json({ status: false, message: "Oops, cela est dommage..." });
  }
});

//! MATCH CATEGORIES
router.get("/match-categories/:token", async (req, res) => {
  const { token } = req.params;

  let foundUser = await UserModel.findOne({ token: token }).populate(
    "categories"
  );

  if (foundUser.categories != 0) {
    let allRequests = [];
    let requests = await RequestModel.find({
      $and: [{ category: foundUser.categories }, { helper: null }],
    })
      .populate("asker")
      .populate("category")
      .populate({
        path: "asker",
        populate: {
          path: "categories",
          model: "categories",
        },
      });

    res.json({ status: true, matchingRequests: requests });
  } else {
    res.json({ status: false, message: "Vous n'avez pas encore de match" });
  }
});

//! addwilling_user
router.put("/add-willing-user/:requestId/:token", async (req, res) => {
  console.log("add willing user");
  const { requestId, token } = req.params;

  let currentUser = await UserModel.findOne({ token: token });

  if (currentUser) {
    let updateWilling = await RequestModel.updateMany(
      { _id: requestId },
      {
        $push: { willing_users: currentUser._id },
      }
    );

    let updateConversation = await RequestModel.updateMany(
      { _id: requestId },
      {
        $push: {
          conversations: { conversation_id: currentUser._id, messages: [] },
        },
      }
    );
    let foundRequest = await RequestModel.findById(requestId)
      .populate("asker")
      .populate("category")
      .populate("conversations")
      .populate({
        path: "conversations",
        populate: {
          path: "conversation_id",
          model: "users",
        },
      });

    let foundConversation = foundRequest.conversations.find(
      (conversation) => conversation.conversation_id._id === currentUser._id
    );
    console.log(foundConversation);
    let data = {
      ...foundConversation,
      category: foundRequest.category,
      requestId: foundRequest._id,
      asker: foundRequest.asker,
      request: foundRequest,
    };

    res.json({ status: true, request: data });
  } else {
    res.json({ status: false, message: "une erreur s'est produite" });
  }
});

//get-messages

// add messeges
router.put("/add-message", async (req, res) => {
  const { token, requestId, conversationToken, content } = req.body;

  console.log("add message");
  console.log("data", req.body);

  let currentUser = await UserModel.findOne({ token: token });

  if (currentUser) {
    let data = {
      author: currentUser._id,
      message: content,
      insert_date: new Date(),
    };

    let foundRequest = await RequestModel.findById(requestId)
      .populate("conversations")
      .populate({
        path: "conversations",
        populate: { path: "conversation_id", model: "users" },
      });

    let foundConversation = foundRequest.conversations.find(
      (conversation) => conversation.conversation_id.token === conversationToken
    );
    foundConversation.messages.push(data);
    let savedRequest = await foundRequest.save();
    res.json({ status: true, savedRequest });
  } else {
    res.json({
      status: false,
      message: "le message n'a pas pu etre enregistre",
    });
  }
});

//! SUGGESTIONS EN GET
//
// ─── /suggestions EN GET ─────────────────────────────────────────────────────────
// HOME SCREEN : carroussel du Dashbord. (find sur toutes les categories s=dont les suggestions sont à "true")

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
