const express = require("express");
const app = express();
const {
  models: { User },
} = require("./db");

module.exports = app;

app.use(express.json());

app.post("/api/auth", async (req, res, next) => {
  try {
    const token = await User.authenticate(req.body);
    res.send({ token });
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  res.status(err.status || 500).send({ error: err.message });
});
