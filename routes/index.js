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
  const { token } = req.params;
  //get current User grâce au token passé en params
  let currentUser = await UserModel.findOne({ token: token });

  //regarder si l'id de l'utilisateur en cours de session se retrouve dans un document de "requests" de la BDD. Le cas échéant, il y a match.
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
    .populate("selected_users") // avant modif : "accepted_users"
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
router.get("/users-by-category/:category", async (req, res) => {
  const { category } = req.params;

  let foundCategory = await CategoryModel.findOne({
    $or: [{ category: category }, { sub_category: category }],
  });

  if (foundCategory) {
    let foundUsers = await UserModel.find({
      categories: foundCategory._id,
    }).populate("categories");

    res.json({ status: true, foundUsers });
  } else {
    res.json({ status: false, message: "Opps, c'est embetant..." });
  }
});

//! addRequest en POST
router.post("/add-request", async (req, res) => {
  const {
    address_street_1,
    address_zipcode,
    address_city,
    category,
    description,
    disponibility,
    userToken,
    selectedUsers,
  } = req.body;

  let foundAsker = await UserModel.findOne({ token: userToken });

  if (foundAsker) {
    let foundCategory = await CategoryModel.findOne({
      $or: [{ category: category }, { sub_category: category }],
    });

    let conversations = [];
    selectedUsers.forEach((userId) => {
      conversations.push({
        conversation_id: userId,
        messages: [],
      });
    });

    let newRequest = new RequestModel({
      asker_status: 0,
      helper_status: 0,
      category: foundCategory._id,
      description: description,
      disponibility: disponibility,
      address: {
        address_street_1: address_street_1,
        address_city: address_city,
        address_zipcode: address_zipcode,
      },
      insert_date: new Date(),
      confirmation_date: null,
      end_date: null,
      credit: null,
      helper: null,
      asker: foundAsker._id,
      selected_users: selectedUsers,
      conversations: conversations,
    });

    let savedRequest = await newRequest.save();

    res.json({ status: true, savedRequest });
  } else {
    res.json({ status: false, message: "Oops, c'est dommage" });
  }
});

// ADD

module.exports = router;
