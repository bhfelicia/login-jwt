const Sequelize = require("sequelize");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
User.addHook("beforeSave", async function (user) {
  if (user._changed.has("password")) {
    user.password = await bcrypt.hash(user.password, 5);
  }
});
//below not working
// User.beforeSave = function (user) {
//   user.password = bcrypt.hash(user.password, 5);
// };
User.authenticate = async function ({ username, password }) {
  const user = await User.findOne({ where: { username } });
  if (user && (await bcrypt.compare(password, user.password))) {
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
    if (user) return user;
    const error = Error("bad credentials");
    error.status = 401;
    throw error;
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

module.exports = {
  syncAndSeed,
  models: {
    User,
  },
};
