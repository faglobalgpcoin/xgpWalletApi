const joi = require("../../../../lib/joi");
const db = require("../../../../lib/sql");
const luniverse = require("../../../../lib/luniverse");
const ethereum = require("../../../../lib/ethereum");
const bitcoin = require("../../../../lib/bitcoin");

async function login(req, res) {
  const validateCheck = joi.otherLoginFormCheck(req.body);

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

  let user = null;
  try {
    user = await db.users.otherLogin(req.body);
    if (!user) {
      res.status(400);
      returnObj.message = "Login failed";
      return res.json(returnObj);
    }
  } catch(e) {
    res.status(400);
    returnObj.message = "API Error";
    return res.json(returnObj);
  }

  if (user) {
    const returnData = {
      name: user.name,
      emailAddress: user.emailAddress,
      phoneNumber: user.phoneNumber,
      userId: user.userId
    }
    returnObj.status = "success";
    returnObj.data = returnData;
  }

  return res.json(returnObj);
}

async function getBalance(req, res) {
  const { userId, address, token, tokenType } = req.query;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let balance = null;
  let user = null;
  if (address) {
    try {
      if (tokenType === "luniverse") {
        balance = await luniverse.getBalanceV2(address, token);
      } else if (tokenType === "ethereum") {
        balance = await ethereum.getBalance(address, token);
      } else {
        balance = await bitcoin.getBalance(address, token);
      }
    } catch (e) {
      console.log(e);
      res.status(400);
      returnObj.message = "getBalance failed";
      return res.json(returnObj);
    }
  } else {
    try {
      user = await db.users.findByEmailAddress(userId);
      if (!user) {
        res.status(400);
        returnObj.message = "getBalance failed";
        return res.json(returnObj);
      }
      if (tokenType === "luniverse") {
        balance = await luniverse.getBalanceV2(user.address, token);
      } else if (tokenType === "ethereum") {
        balance = await ethereum.getBalance(user.ethAddress, token);
      } else {
        balance = await bitcoin.getBalance(user.btcAddress, token);
      }
    } catch (e) {
      console.log(e);
      res.status(400);
      returnObj.message = "getBalance failed";
      return res.json(returnObj);
    }
  }

  returnObj.status = "success";
  returnObj.data = { balance };

  return res.json(returnObj);
}

async function getAddress(req, res) {
  const { userId, tokenType } = req.query;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let address = null;
  try {
    if (tokenType === "luniverse") {
      address = await db.users.findByEmailAddress(userId);
      if (!address) {
        res.status(400);
        returnObj.message = "getAddress failed";
        return res.json(returnObj);
      }
      address = address.address;
    } else if (tokenType === "ethereum") {
      address = await db.users.findByEmailAddress(userId);
      if (!address) {
        res.status(400);
        returnObj.message = "getAddress failed";
        return res.json(returnObj);
      }
      address = address.ethAddress;
    } else {
      address = await db.users.findByEmailAddress(userId);
      if (!address) {
        res.status(400);
        returnObj.message = "getAddress failed";
        return res.json(returnObj);
      }
      address = address.btcAddress;
    }
  } catch (e) {
    console.log(e);
    res.status(400);
    returnObj.message = "getAddress failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = { address };

  return res.json(returnObj);
}

async function send(req, res) {
  const { address, type, amount, sideTokenSymbol } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let allowanceAddress = null;
  let salesAddress = null;
  let sendResult = null;
  let balance = null;

  try {
    let sendObj;
    allowanceAddress = await db.appProperty.findByKey("allowance_address");
    salesAddress = await db.appProperty.findByKey("sales_address");

    if (type === "send") {
      balance = await luniverse.getBalanceV2(allowanceAddress.value, sideTokenSymbol);
      if (parseFloat(balance) < parseFloat(amount)) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      sendObj = {
        from: allowanceAddress.value,
        to: address,
        amount: parseFloat(amount),
        sideTokenSymbol,
        whereSend: "apiSend"
      }
    } else {
      sendObj = {
        from: address,
        to: salesAddress.value,
        amount: parseFloat(amount),
        sideTokenSymbol,
        whereSend: "apiSend"
      }
    }

    sendResult = await luniverse.sendTokenV2(sendObj);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "Send failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = sendResult;

  return res.json(returnObj);
}

module.exports = {
  login,
  getBalance,
  getAddress,
  send,
}
