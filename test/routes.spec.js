const {
  models: { User },
  syncAndSeed,
} = require("../db");
const jwt = require("jsonwebtoken");
const app = require("supertest")(require("../app"));

const { expect } = require("chai");

describe("Routes", () => {
  let seed;
  beforeEach(async () => (seed = await syncAndSeed()));
  describe("seeded data", () => {
    it("there are 3 users", () => {
      expect(Object.keys(seed.users).length).to.equal(3);
    });
  });
  describe("POST /api/auth", () => {
    describe("with valid credentials", () => {
      it("returns a token", async () => {
        const response = await app
          .post("/api/auth")
          .send({ username: "jerry", password: "jerry_pw" });
        expect(response.status).to.equal(200);
        expect(response.body.token).to.be.ok;
      });
    });
    describe("with invalid credentials", () => {
      it("gets back a 401 and an error", async () => {
        const response = await app
          .post("/api/auth")
          .send({ username: "jerry", password: "jerry_p" });
        expect(response.status).to.equal(401);
        expect(response.body.error).to.equal("bad credentials");
      });
    });
  });
});
