const jwt = require("../../../../lib/jwt");
const db = require("../../../../lib/sql");
const luniverse = require("../../../../lib/luniverse");
const joi = require("../../../../lib/joi");
const redis = require("../../../../lib/redis");

async function memberInfo(req, res) {
  const { accessToken } = req.body;

  const validateCheck = joi.externalMemberInfo(req.body);

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
  let balance = null;
  let data = null;

  try {
    user = await jwt.decodeAccessToken(accessToken);
    user = await db.users.findById(user.id);

    if (!user) {
      returnObj.message = "invalid accessToken";
      return res.json(returnObj);
    }

    balance = await luniverse.getBalanceV2(user.address, "XGP");
    data = {
      userId: user.userId,
      emailAddress: user.emailAddress,
      balance: balance
    }
  } catch(e) {
    console.log(e);
    returnObj.message = "invalid accessToken";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = data;

  return res.json(returnObj);
}

async function point(req, res) {
  const { accessToken, txId, volume } = req.body;

  const validateCheck = joi.externalPoint(req.body);

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
  let address = null;
  let balance = null;
  let couponRate = null;
  let couponAddress = null;
  let checkPurchaseRestrictions = null;
  let purchase = null;
  let sendObj = null;
  let send = null;
  let convertVolume = null;

  try {
    user = await jwt.decodeAccessToken(accessToken);
    user = await db.users.findById(user.id);
    address = user.address;
    couponRate = await db.appProperty.findByKey('coupon_market_rate');
    couponRate = couponRate.value;
    couponAddress = await db.appProperty.findByKey('coupon_market_address');
    couponAddress = couponAddress.value;
    const xgpPrice = await redis.get("xgpPrice");
    convertVolume = Math.ceil(parseFloat(volume) / xgpPrice);

    const now = new Date();
    const monthFirst = new Date(now.getFullYear(), now.getMonth(), 1, -9);
    const monthLast = new Date(now.getFullYear(), now.getMonth()+1, 0, 14,59, 59);

    if (!address) {
      returnObj.message = "invalid user";
      return res.json(returnObj);
    }

    balance = await luniverse.getBalanceV2(address, "XGP");

    if (parseFloat(convertVolume) > parseFloat(balance)) {
      returnObj.message = "not enough coin";
      return res.json(returnObj);
    }

    checkPurchaseRestrictions = await db.market.checkPurchaseRestrictions(user.phoneNumber, monthFirst, monthLast, couponRate);

    if (!checkPurchaseRestrictions) {
      returnObj.message = "purchase limit exceeded";
      return res.json(returnObj);
    }

    sendObj = {
      from: address,
      to: couponAddress,
      amount: parseFloat(convertVolume),
      sideTokenSymbol: "XGP",
      whereSend: "marketSend"
    }

    send = await luniverse.sendTokenV2(sendObj);
    if (!send) {
      returnObj.message = "purchase error";
      return res.json(returnObj);
    }

    purchase = await db.market.registerPurchase(user.userId, user.phoneNumber, txId, volume, convertVolume);
  } catch(e) {
    console.log(e);
    returnObj.message = "invalid accessToken";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = purchase.id;

  return res.json(returnObj);
}

async function goToOffice(req, res) {
  const { accessToken } = req.query;
  const options = {
    domain: 'xgpinco.com',
    maxAge: 86400000, // two weeks in milliseconds,
    httpOnly: true,
    secure: true
  }
  res.cookie("token", accessToken, options);
  return res.redirect("https://office.xgpinco.com");
}

async function getXgpPrice(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const xgpPrice = await redis.get("xgpPrice");

  returnObj.status = "success";
  returnObj.data = xgpPrice;

  return res.json(returnObj);
}

module.exports = {
  memberInfo,
  point,
  goToOffice,
  getXgpPrice
}
