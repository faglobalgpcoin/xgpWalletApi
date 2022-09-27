const express = require('express');
const router = express.Router();

const adminController = require("./admin.controller");

router.post("/login", adminController.login)
router.get("/me", adminController.getAdminUserInfo);
router.get("/adminlist", adminController.getAdminAllUsers);
router.post("/registerAdminUser", adminController.registerAdminUser);
router.post("/modifyAdminUser", adminController.modifyAdminUser);
router.post("/deleteAdminUser", adminController.deleteAdminUser);
router.post("/registerAppProperty", adminController.registerAppProperty);
router.post("/updateAppProperty", adminController.updateAppProperty);
router.get("/userAll", adminController.getAllUsers);
router.get("/userList", adminController.getUserList);
router.post("/lockUp", adminController.setLockUp);
router.post("/modifyUser", adminController.modifyUser);
router.get("/adminAllowIps", adminController.getAdminAllowIps);
router.post("/deleteAdminIp", adminController.deleteAdminIp);
router.post("/registerAdminIp", adminController.registerAdminIp);
router.post("/airdrop", adminController.airdrop);
router.post("/airdropBack", adminController.airdropBack);
router.post("/airdropWithId", adminController.airdropWithId);
router.post("/airdropBackWithId", adminController.airdropBackWithId);
router.get("/transactionsAll", adminController.getAllTransactions);
router.get("/transactionList", adminController.getTransactionList);
router.get("/couponPurchaseHistoryAll", adminController.getAllCouponPurchaseHistory);
router.get("/couponPurchaseHistory", adminController.getCouponPurchaseHistory);
router.post("/registerNotice", adminController.registerNotice);
router.patch("/updateNotice", adminController.updateNotice);

module.exports = router;
