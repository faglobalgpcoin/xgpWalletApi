const express = require('express');
const router = express.Router();

const userController = require("./user.controller");

router.get("/me", userController.getUserInfo);
router.post("/modify", userController.modifyUser);

module.exports = router;
