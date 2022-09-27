const db = require("../../../../lib/sql");
const ethereum = require("../../../../lib/ethereum");
const bitcoin = require("../../../../lib/bitcoin");
const joi = require("../../../../lib/joi");
const bcrypt = require("../../../../lib/bcrypt");
const verifyCode = require("../../../../lib/verifyCode");

async function getUserInfo(req, res) {
  let { user } = req;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  if (!user) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  try {
    user = await db.users.findById(user.id);
    if (!user.ethAddress) {
      const ethWallet = await ethereum.createWallet();
      user.ethAddress = ethWallet.address;
      await user.save();
    }
    if (!user.btcAddress) {
      const btcWallet = await bitcoin.createWallet();
      user.btcAddress = btcWallet.address;
      await user.save();
    }
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = user;

  return res.json(returnObj);
}

async function modifyUser(req, res) {
  let { user } = req;
  const validateCheck = joi.userModifyFormCheck(req.body);

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  if (validateCheck.error) {
    res.status(400);
    returnObj.message = validateCheck.error.details[0].message;
    return res.json(returnObj);
  }

  if (!user) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  try {
    user = await db.users.findById(user.id);
    const emailCheckObj = {
      code: req.body.emailCode,
      emailAddress: user.emailAddress
    }

    const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);

    if (!emailCodeCheck) {
      console.log(e);
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (req.body.password !== "") {
      const passwordHash = await bcrypt.createPasswordHash(req.body.password);
      user.password = passwordHash;
      user.save();
    }

    if (req.body.pinCode !== "") {
      const pinCodeHash = await bcrypt.createPasswordHash(req.body.pinCode);
      user.pinCode = pinCodeHash;
      user.save();
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";

  return res.json(returnObj);
}

module.exports = {
  getUserInfo: getUserInfo,
  modifyUser: modifyUser
}
