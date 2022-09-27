const Joi = require("joi");

function loginFormCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    password: Joi.string().min(8).required()
  }

  return Joi.validate(form, schema);
}

function signUpFormCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    name: Joi.string().regex(/^[,. a-zA-Z]+$/).required(),
    password: Joi.string().min(8).required(),
    pinCode: Joi.string().min(4).required(),
    phoneNumber: Joi.number().required(),
    emailCode: Joi.number().required(),
    //mobileCode: Joi.number().required(),
  }

  return Joi.validate(form, schema);
}

function changePasswordFormCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    emailAddress: Joi.string().email().required(),
    newPassword: Joi.string().min(8).required(),
    code: Joi.number().required()
  }

  return Joi.validate(form, schema);
}

function emailVerifyCodeCheck(form) {
  const schema = {
    sendTypeKind: Joi.string().valid("SMS","EMAIL_FOR_SIGNUP", "EMAIL_FOR_PASSWORD", "EMAIL_FOR_COIN_SEND").required(),
    emailAddress: Joi.string().email().allow(null),
    phoneNumber: Joi.number().allow(null),
  }

  return Joi.validate(form, schema);
}

function codeVerifyCheck(form) {
  const schema = {
    emailAddress: Joi.string().email().allow(null),
    phoneNumber: Joi.number().allow(null),
    code: Joi.number().required()
  }

  return Joi.validate(form, schema);
}

function sendTokenCheck(form) {
  const schema = {
    receiveAddress: Joi.string().required(),
    amount: Joi.string().required(),
    sideTokenSymbol: Joi.string().valid("XGP", "ETH", "BTC").required(),
    type: Joi.string().valid("luniverse", "ethereum", "bitcoin").required(),
    pinCode: Joi.string().required().min(4),
    emailCode: Joi.string().required().min(6)
  }

  return Joi.validate(form, schema);
}

function userModifyFormCheck(form) {
  const schema = {
    emailAddress: Joi.string().email().required(),
    password: Joi.string().required().allow(null, "").min(8),
    pinCode: Joi.string().required().allow(null, "").min(4),
    emailCode: Joi.number().required(),
  }

  return Joi.validate(form, schema);
}

function otherLoginFormCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    password: Joi.string().required().min(8),
  }

  return Joi.validate(form, schema);
}

function adminLoginFormCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    password: Joi.string().min(8).required()
  }

  return Joi.validate(form, schema);
}

function airDropCheck(form) {
  const schema = {
    receiveAddress: Joi.string().required(),
    amount: Joi.string().required(),
    sideTokenSymbol: Joi.string().valid("XGP").required(),
    type: Joi.string().valid("luniverse").required(),
  }

  return Joi.validate(form, schema);
}

function airDropWithIdCheck(form) {
  const schema = {
    userId: Joi.string().required(),
    amount: Joi.string().required(),
    sideTokenSymbol: Joi.string().valid("XGP").required(),
    type: Joi.string().valid("luniverse").required(),
  }

  return Joi.validate(form, schema);
}

function externalMemberInfo(form) {
  const schema = {
    accessToken: Joi.string().required()
  }

  return Joi.validate(form, schema);
}

function externalPoint(form) {
  const schema = {
    accessToken: Joi.string().required(),
    volume: Joi.number().required(),
    txId: Joi.string().required(),
  }

  return Joi.validate(form, schema);
}

module.exports = {
  loginFormCheck: loginFormCheck,
  signUpFormCheck: signUpFormCheck,
  changePasswordFormCheck: changePasswordFormCheck,
  emailVerifyCodeCheck: emailVerifyCodeCheck,
  codeVerifyCheck: codeVerifyCheck,
  sendTokenCheck: sendTokenCheck,
  userModifyFormCheck: userModifyFormCheck,
  otherLoginFormCheck: otherLoginFormCheck,
  adminLoginFormCheck: adminLoginFormCheck,
  airDropCheck: airDropCheck,
  airDropWithIdCheck,
  externalMemberInfo,
  externalPoint
}
