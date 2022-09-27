const express = require('express');
const router = express.Router();

const supportController = require("./support.controller");

router.get("/appProperties", supportController.getAppProperties);
router.get("/appProperty", supportController.getAppProperty);
router.get("/notices/:inuse?", supportController.getNotices);
router.get("/getTokenInfo", supportController.getTokenInfo);

router.post("/test", supportController.test);
router.post("/test2", supportController.test2);
/*

router.post("/test3", supportController.test3);*/

module.exports = router;
