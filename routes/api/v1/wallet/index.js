const express = require('express');
const router = express.Router();

const walletController = require("./wallet.controller");

router.post("/send", walletController.sendToken);
router.get("/getBalance/:token", walletController.getBalance);
router.get("/getBalance/:type/:token", walletController.getBalanceToType);
router.get("/getBalance/:type/:token/:address", walletController.getBalanceToAddressAndType);
router.get("/getTransactions/:type/:token", walletController.getTransactionsToType);
router.post("/validateAddress", walletController.validateAddress);

module.exports = router;
