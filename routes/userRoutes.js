const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const randomString = require("randomstring");
const nodemailer = require("nodemailer");
const jwt_secret = process.env.JWT_PRIVATE_KEY;
const { check, validationResult } = require("express-validator");
const app = express();

app.use(express.json());

// const BASE_URL = process.env.BASE_URL;

//all the models are listed below
const user = require("../models/user");
const userAuth = require("../middlewares/userAuth");
// const user = require("../models/user");

const signupExpressValidation = [
  check("userName", "Name length should be 5 to 20 characters").isLength({
    min: 5,
    max: 20,
  }),
  check("userEmail", "Enter a valid email").isEmail().isLength({
    min: 10,
  }),
  check(
    "password",
    "Length of password should be minimum of 8 characters"
  ).isLength({
    min: 8,
  }),
];

router.get("/getUser", userAuth, async (req, res) => {
  try {
    const userDetails = await user.findById(req.body.belongsTo);
    const { userName } = userDetails;
    res.status(200).send({ userName });
  } catch (error) {
    res.status(400).send({ success: "false", msg: error.message });
  }
});

router.post("/verifyOtp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const userExist = await user.findOne({ userEmail: email });
    if (userExist) {
      return res.status(400).json({ success: false, msg: "Invalid request" });
    }

    // let transporter = nodemailer.createTransport({
    //   host: "smtp.gmail.com",
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.USERMAIL,
    //     pass: process.env.USERMAILPASS,
    //   },
    // });
    let transporter = nodemailer.createTransport({
      host: "gmail",
      port: 587,
      secure: false,
      logger: true,
      debug: true,
      secureConnection: false,
      auth: {
        user: process.env.USERMAIL,
        pass: process.env.USERMAILPASS,
      },
      tls: {
        rejectUnauthorized: true,
      },
    });

    await transporter.sendMail({
      from: "testing.kartikwebsites@gmail.com",
      to: email,
      subject: "Request for reset your password",
      html: `<p>your OTP is ${otp}</p>`, // html body
    });
    res.status(200).send({ success: true, msg: "OTP sent successfully" });
  } catch (error) {
    res.status(400).send({ success: false, msg: error });
  }
});

router.post("/signup", signupExpressValidation, async (req, res) => {
  try {
    const errorsObj = validationResult(req);
    if (!errorsObj.isEmpty()) {
      return res.status(200).json({ success: false, err: errorsObj.errors });
    }

    const { userName, userEmail, password, confirmPassword } = req.body;
    const userExist = await user.find({ userEmail });
    if (userExist[0]) {
      return res
        .status(200)
        .json({ success: false, msg: "User already exists" });
    }
    if (password != confirmPassword) {
      return res
        .status(200)
        .json({ success: false, msg: "Password doesn't match" });
    }

    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        const newUser = new user({
          userName,
          userEmail,
          password: hash,
        });
        newUser.save();
      });
    });
    res.status(200).json({ success: true, msg: "User Signedup successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, msg: "Internal Server Error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { userEmail, password } = req.body;

    const userExist = await user.find({ userEmail });
    if (!userExist[0]) {
      return res
        .status(404)
        .json({ success: false, msg: "user doesn't exist" });
    }
    bcrypt.compare(password, userExist[0].password, function (err, result) {
      if (err)
        return res.status(403).json({ success: false, msg: err.message });
      if (result) {
        const data = {
          user: {
            id: userExist[0]._id,
          },
        };
        const token = jwt.sign(data, jwt_secret);
        res.cookie("auth_token", token, {
          expires: new Date(Date.now() + 9000000000),
        });
        res.status(200).json({ success: true, msg: "Login Successfully" });
      } else {
        res
          .status(403)
          .json({ success: false, msg: "Invalid Login Credentials" });
      }
    });
  } catch (error) {
    console.log("ess");
    console.log(error.message);
    res.status(500).json({ success: false, msg: "Error while login in" });
  }
});

router.post("/forget-password", async (req, res) => {
  try {
    const email = req.body.email;
    const userExist = await user.findOne({ userEmail: email });
    if (!userExist) {
      return res.status(400).json({ success: false, msg: "Invalid request" });
    }
    const token = randomString.generate();
    await user.updateOne({ userEmail: email }, { $set: { token } });

    // ********
    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.USERMAIL,
        pass: process.env.USERMAILPASS,
      },
    });

    await transporter.sendMail({
      from: "testing.kartikwebsites@gmail.com",
      to: email,
      subject: "Request for reset your password",
      html: `<p>your request has been fullfilled and you are requested to click here<a href='${BASE_URL}/reset-password?token=${token}'>Reset password</a> to change your password</p>`, // html body
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res
      .status(400)
      .json({ success: false, msg: "Unable to process your request" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { newPassword, confirmNewPassword, token } = req.body;
    const verifyToken = await user.findOne({ token });
    if (!verifyToken) {
      return res
        .status(404)
        .json({ success: false, msg: "Invalid Credentials" });
    }
    if (newPassword != confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, msg: "Fill details correctly" });
    }
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await user.updateOne({ token }, { $set: { password: hashedPassword } });
    res.status(200).json({ success: true, msg: "Reset successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, msg: error.message });
  }
});

module.exports = router;
