const express = require('express');
const router = express.Router();

const authController = require("./auth.controller");

router.post("/login", authController.login);
router.post("/signup", authController.signUp);
router.post("/sendcodeforverifyrequest", authController.sendCodeForVerifyRequest);
router.post("/checkverifycode", authController.checkVerifyCode);
router.get("/existsbyemail", authController.existsByEmail);
router.get("/existsbyuserId", authController.existsByUserId);
router.get("/existsbyphonenumber", authController.existsByPhoneNumber);
router.get("/existsbyuseridandemailaddress", authController.existsByUserIdAndEmailAddress);
router.patch("/changepassword", authController.changePassword);
router.get("/logout", authController.logout);

module.exports = router;
