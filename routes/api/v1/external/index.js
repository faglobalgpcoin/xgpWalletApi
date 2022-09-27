const express = require('express');
const router = express.Router();

const externalController = require("./external.controller");

router.get("/callback_memberinfo", externalController.memberInfo);
router.get("/callback_point", externalController.point);
router.get("/goToOffice", externalController.goToOffice);
router.post("/callback_memberinfo", externalController.memberInfo);
router.post("/callback_point", externalController.point);
router.get("/getXgpPrice", externalController.getXgpPrice);

module.exports = router;
