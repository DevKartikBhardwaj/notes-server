const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.JWT_PRIVATE_KEY;
const user = require("../models/user");

const userAuth = async (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, msg: "Login to access the page" });
  }

  const decoded = jwt.verify(token, jwt_secret);

  const userExist = await user.findById(decoded.user.id);
  if (!userExist) {
    return res
      .status(400)
      .json({ success: false, msg: "Login to access the page" });
  }

  req.body.belongsTo = userExist._id;
  next();
};

module.exports = userAuth;
