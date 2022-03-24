var app = require("../app");
var request = require("supertest");
var mongoose = require("mongoose");
var UserModel = require("../models/users");

beforeAll((done) => {
  done();
});

describe("Connexion Tests", () => {
  test("POST sign in", async () => {
    await request(app)
      .post("/users/sign-in")
      .expect("Content-Type", /json/)
      .send({
        email: "fred@mail.com",
        password: "a",
      })
      .expect(200)
      .expect((res) => {
        res.body.status = true;
        res.body.user.token = "8H4i8XilSskV1IhkjxGc9hb0f6VgAQt2";
      });
  });

  test("POST sign up email already exists", async () => {
    await request(app)
      .post("/users/sign-up")
      .expect("Content-Type", /json/)
      .send({
        email: "fred@mail.com",
      })
      .expect(200)
      .expect((res) => {
        res.body.status = false;
        res.body.message = "Email déjà utilisé";
      });
  });

  test("POST sign up check for saved user", async () => {
    await request(app)
      .post("/users/sign-up")
      .expect("Content-Type", /json/)
      .send({
        firstName: "test",
        lastName: "test",
        email: "test@mail.com",
        password: "a",
        birth_date: "1989-11-21",
        gender: "male",
      })
      .expect(200)
      .expect((res) => {
        res.body.status = true;
        res.body.user.email = "test@mail.com";
      });
  });

  test("GET /get-user", async () => {
    let token = "8H4i8XilSskV1IhkjxGc9hb0f6VgAQt2";
    await request(app)
      .get(`/users/get-user/${token}`)
      .expect(200)
      .expect((res) => {
        res.body.user.token = token;
      });
  });
}, 10000);

afterAll(async () => {
  await UserModel.deleteOne({ email: "test@mail.com" });
  await mongoose.connection.close();
});
