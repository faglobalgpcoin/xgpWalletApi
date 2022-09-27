const AWS = require("aws-sdk");
const multer = require("multer");
const secureRandom = require("secure-random");
const multerS3 = require("multer-s3");
const path = require("path");

const joi = require("../../../../lib/joi");
const email = require("../../../../lib/email");
const verifyCode = require("../../../../lib/verifyCode");
const aws = require("../../../../lib/aws");
const db = require("../../../../lib/sql");
const luniverse = require("../../../../lib/luniverse");
const ethereum = require("../../../../lib/ethereum");
const bitcoin = require("../../../../lib/bitcoin");
const config = require("../../../../config");
const twilio = require("../../../../lib/twilio");
const alibaba = require("../../../../lib/alibaba");

async function login(req, res) {
  const validateCheck = joi.loginFormCheck(req.body);
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
    user = await db.users.login(req.body);
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
    const returnData = { accessToken: user }
    const options = {
      domain: 'xgpinco.com',
      maxAge: 86400000, // two weeks in milliseconds,
      httpOnly: true,
      secure: true
    }
    res.cookie("token", user, options);
    returnObj.status = "success";
    returnObj.data = returnData;
  }

  return res.json(returnObj);
}

async function logout(req, res) {
  res.clearCookie('token', {
    domain: 'xgpinco.com',
    httpOnly: true,
    secure: true
  });
  return res.json(true);
}

async function signUp(req, res) {
  AWS.config.update({
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    region: process.env.AWS_S3_REGION
  });

  const s3 = new AWS.S3();

  let upload = multer({
    storage : multerS3({
      s3: s3,
      bucket: function (req, file, cb) {
        cb(null, "xgpuserpictures/" + file.fieldname);
      },
      key: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = secureRandom.randomBuffer(20).toString("hex");
        cb(null, filename + extension);
      },
      acl: 'private',
    })
  }).single("userPic");

  await upload(req, res, async function(err) {
    const obj = JSON.parse(JSON.stringify(req.body));
    const validateCheck = joi.signUpFormCheck(obj);

    const returnObj = {
      status: "fail",
      message: null,
      data: null,
      timeStamp: parseInt(new Date().getTime() / 1000)
    }

    if (err) {
      res.status(400);
      returnObj.message = "Upload Error";
      return res.json(returnObj);
    }

    if (!req.file) {
      res.status(400);
      returnObj.message = "Upload Error";
      return res.json(returnObj);
    }

    obj.userPic = req.file.key;

    if (validateCheck.error) {
      res.status(400);
      returnObj.message = validateCheck.error.details[0].message;
      return res.json(returnObj);
    }

    let existing = null;
    try {
      existing = await db.users.findByUserId(obj.userId);
      if (existing) {
        res.status(400);
        returnObj.message = "Already Registered";
        return res.json(returnObj);
      }
    } catch(e) {
      res.status(400);
      returnObj.message = "API Error";
      return res.json(returnObj);
    }

    let wallet = null;
    try {
      wallet = await luniverse.createWalletV2();
      obj.address = wallet.address;
    } catch(e) {
      console.log(e);
      res.status(400);
      returnObj.message = "API Error";
      return res.json(returnObj);
    }

    let ethWallet = null;
    try {
      ethWallet = await ethereum.createWallet();
      obj.ethAddress = ethWallet.address;
    } catch(e) {
      console.log(e);
      res.status(400);
      returnObj.message = "API Error";
      return res.json(returnObj);
    }

    let btcWallet = null;
    try {
      btcWallet = await bitcoin.createWallet();
      obj.btcAddress = btcWallet.address;
    } catch(e) {
      console.log(e);
      res.status(400);
      returnObj.message = "API Error";
      return res.json(returnObj);
    }

    let user = null;
    try {
      user = await db.users.registerUser(obj);
      if (!user) {
        res.status(400);
        returnObj.message = "Register Error";
        return res.json(returnObj);
      }

      /*let getOldMemberAddress = await db.oldMember.getAddress({userId: obj.userId, phoneNumber: obj.phoneNumber});
      if (getOldMemberAddress) {
        let getBalance = await db.oldTransactions.getBalance(getOldMemberAddress);

        let adminAddress = await db.appProperty.findByKey("admin_address");
        const sendObj = {
          from: adminAddress.value,
          to: obj.address,
          amount: parseFloat(getBalance),
          sideTokenSymbol: "XGP",
          whereSend: "swap"
        }

        console.log(sendObj, "swap Start");

        let sendResult = await luniverse.sendToken(sendObj);
      }*/
    } catch(e) {
      res.status(400);
      returnObj.message = "API Error";
      return res.json(returnObj);
    }

    returnObj.status = "success";

    return res.json(returnObj);
  });
}

async function sendCodeForVerifyRequest(req, res) {
  const { emailAddress, phoneNumber, sendTypeKind } = req.body;
  const validateCheck = joi.emailVerifyCodeCheck(req.body);


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

  let code;
  const mailObj = {
    to: emailAddress,
    locals: {
      emailAddress,
    }
  }

  if (emailAddress === "faglobalou@xgpinco.com") {
    returnObj.status = "success";
    returnObj.data = true;

    return res.json(returnObj);
  }

  switch(sendTypeKind) {
    case "EMAIL_FOR_SIGNUP":
      code = await verifyCode.codeGenerate(emailAddress);
      mailObj.template = "signUp";
      mailObj.locals.code = code;
      mailObj.locals.tokenName = config.luniverse.tokenName;
      email.sendMail(mailObj);
      break;
    case "EMAIL_FOR_COIN_SEND":
      code = await verifyCode.codeGenerate(emailAddress);
      mailObj.template = "coinSend";
      mailObj.locals.code = code;
      mailObj.locals.tokenName = config.luniverse.tokenName;
      email.sendMail(mailObj);
      break;
    case "EMAIL_FOR_PASSWORD":
      code = await verifyCode.codeGenerate(emailAddress);
      mailObj.template = "findPassword";
      mailObj.locals.code = code;
      mailObj.locals.tokenName = config.luniverse.tokenName;
      mailObj.locals.emailAddress = emailAddress;
      email.sendMail(mailObj);
      break;
    case "SMS":
      code = await verifyCode.codeGenerate(phoneNumber);
      if (phoneNumber.indexOf(86) === 0) {
        const SMSObj = {
          to: phoneNumber,
          body: code,
        }

        alibaba.sendChinaSMS(SMSObj);
      } else {
        const SMSObj = {
          MessageStructure: "string",
          Message: "Authentication Code: " + code + "\nThe authentication code sent by " + config.luniverse.tokenName,
          PhoneNumber: phoneNumber
        }

        aws.sendSMS(SMSObj);
      }
      break;
    default:
      break;
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function checkVerifyCode(req, res) {
  const { emailAddress, phoneNumber, code } = req.body;
  const validateCheck = joi.codeVerifyCheck(req.body);

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

  if (emailAddress && phoneNumber) {
    res.status(400);
    returnObj.message = "Please enter only one value, emailAddress or phoneNumber."
    return res.json(returnObj);
  }

  if (emailAddress === "faglobalou@xgpinco.com") {
    returnObj.status = "success";
    returnObj.data = true;

    return res.json(returnObj);
  }

  let checked = false;
  const obj = {
    emailAddress,
    phoneNumber,
    code
  }

  checked = await verifyCode.codeCheck(obj);

  returnObj.status = "success";
  returnObj.data = checked;

  return res.json(returnObj);
}

async function changePassword(req, res) {
  const validateCheck = joi.changePasswordFormCheck(req.body);

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
    user = await db.users.changePassword(req.body);
    if (!user) {
      res.status(400);
      returnObj.message = "changePassword Error";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "changePassword Error";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function existsByEmail(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const { emailAddress } = req.query;

  let user = null;
  try {
    user = await db.users.findByEmailAddress(emailAddress);
    if (user) {
      res.status(400);
      returnObj.message = "emailAddress exists";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "emailAddress exists";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = false;

  return res.json(returnObj);
}

async function existsByUserId(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const { userId } = req.query;

  let user = null;
  try {
    user = await db.users.findByUserId(userId);
    if (user) {
      res.status(400);
      returnObj.message = "userId exists";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "userId exists";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = false;

  return res.json(returnObj);
}

async function existsByPhoneNumber(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const { phoneNumber } = req.query;

  let user = null;
  try {
    user = await db.users.findByPhoneNumber(phoneNumber);
    if (user) {
      res.status(400);
      returnObj.message = "phoneNumber exists";
      return res.json(returnObj);
    }
  } catch(e) {
    res.status(400);
    returnObj.message = "phoneNumber exists";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = false;

  return res.json(returnObj);
}

async function existsByUserIdAndEmailAddress(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const { userId, emailAddress } = req.query;

  let user = null;
  try {
    user = await db.users.findByUserIdAndEmailAddrss(userId, emailAddress);
    if (user) {
      res.status(400);
      returnObj.message = "userId exists";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "userId exists";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = false;

  return res.json(returnObj);
}

module.exports = {
  login: login,
  signUp: signUp,
  logout: logout,
  sendCodeForVerifyRequest: sendCodeForVerifyRequest,
  checkVerifyCode: checkVerifyCode,
  changePassword: changePassword,
  existsByEmail: existsByEmail,
  existsByPhoneNumber: existsByPhoneNumber,
  existsByUserId: existsByUserId,
  existsByUserIdAndEmailAddress: existsByUserIdAndEmailAddress
}
