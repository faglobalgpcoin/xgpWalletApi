const express = require("express");
const router = express.Router();

const auth = require("./auth");
const support = require("./support");
const user = require("./user");
const wallet = require("./wallet");
const other = require("./other");
const admin = require("./admin");
const external = require("./external");

router.use("/auth", auth);
router.use("/support", support);
router.use("/user", user);
router.use("/wallet", wallet);
router.use("/other", other);
router.use("/admin", admin);
router.use("/external", external);

module.exports = router;
