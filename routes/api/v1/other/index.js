const express = require('express');
const router = express.Router();

const otherController = require("./other.controller");

router.post("/login", otherController.login);
router.get("/getbalance", otherController.getBalance);
router.post("/send", otherController.send);
router.get("/getaddress", otherController.getAddress)

module.exports = router;
