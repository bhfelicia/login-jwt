const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");

const config = { logging: false };
if (process.env.LOGGING) {
  delete config.logging;
}
const { DataTypes } = Sequelize;

const db = new Sequelize(
  process.env.DATABASE_URL || `postgres://localhost/acme_db`,
  config
);

const User = db.define("user", {
  username: DataTypes.STRING,
  password: DataTypes.STRING,
});
User.authenticate = async function ({ username, password }) {
  const user = await User.findOne({ where: { username, password } });
  if (user) {
    return jwt.sign({ id: user.id }, process.env.JWT);
  }
  const error = Error("bad credentials");
  error.status = 401;
  throw error;
};

User.byToken = async function (token) {
  try {
    const { id } = jwt.verify(token, process.env.JWT);
    const user = await User.findByPk(id);
    return user;
  } catch (ex) {
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
  }
};
const syncAndSeed = async () => {
  await db.sync({ force: true });
  const credentials = [
    { username: "jerry", password: "jerry_pw" },
    { username: "elaine", password: "elaine_pw" },
    { username: "george", password: "george_pw" },
  ];
  const [jerry, elaine, george] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  return {
    users: {
      jerry,
      elaine,
      george,
    },
  };
};

const { expect } = require("chai");
const { ValidationErrorItem } = require("sequelize");

describe("Models", () => {
  let seed;
  beforeEach(async () => (seed = await syncAndSeed()));
  describe("seeded data", () => {
    it("there are 3 users", () => {
      expect(Object.keys(seed.users).length).to.equal(3);
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
    });
  });
});
