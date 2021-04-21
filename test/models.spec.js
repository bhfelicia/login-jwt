const {
  models: { User },
  syncAndSeed,
} = require("../db");
const jwt = require("jsonwebtoken");
const { expect } = require("chai");

describe("Models", () => {
  let seed;
  beforeEach(async () => (seed = await syncAndSeed()));
  describe("seeded data", () => {
    it("there are 3 users", () => {
      expect(Object.keys(seed.users).length).to.equal(3);
    });
    describe("User update", () => {
      describe("change username", () => {
        it("does not change the password", async () => {
          const password = seed.users.elaine.password;
          const elaine = seed.users.elaine;
          elaine.username = "lucy";
          await elaine.save();
          expect(elaine.password).to.equal(password);
        });
      });
    });
    describe("user.authenticate", () => {
      describe("correct credentials", () => {
        it("returns a token", async () => {
          const token = await User.authenticate({
            username: "jerry",
            password: "jerry_pw",
          });
          console.log(token);
          expect(token).to.be.ok;
        });
      });
      describe("incorrect credentials", () => {
        it("throws an error", async () => {
          try {
            await User.authenticate({ username: "jerry", password: "jerry" });
          } catch (error) {
            expect(error.status).to.equal(401);
            expect(error.message).to.equal("bad credentials");
          }
        });
      });
    });
    describe("User.byToken", () => {
      describe("with a valid token", () => {
        it("returns a user", async () => {
          const token = await jwt.sign(
            { id: seed.users.jerry.id },
            process.env.JWT
          );
          const user = await User.byToken(token);
          expect(user.username).to.equal("jerry");
        });
      });
      describe("with an invalid token", () => {
        it("throws a 401", async () => {
          try {
            const token = await jwt.sign(
              { id: seed.users.jerry.id },
              "whatever"
            );
            await User.byToken(token);
          } catch (error) {
            expect(error.status).to.equal(401);
            expect(error.message).to.equal("bad credentials");
          }
        });
      });
      describe("with a valid token but no associated user", () => {
        it("throws a 401", async () => {
          try {
            const token = await jwt.sign({ id: 99 }, process.env.JWT);
            await User.byToken(token);
          } catch (error) {
            expect(error.status).to.equal(401);
            expect(error.message).to.equal("bad credentials");
          }
        });
      });
    });
  });
});
