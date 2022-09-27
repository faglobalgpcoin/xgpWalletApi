const joi = require("../../../../lib/joi");
const db = require("../../../../lib/sql");
const bcrypt = require("../../../../lib/bcrypt");
const luniverse = require("../../../../lib/luniverse");

async function login(req, res) {
  const validateCheck = joi.adminLoginFormCheck(req.body);
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
  let allowIp = null;
  try {
    user = await db.adminUsers.login(req.body);
    if (!user) {
      res.status(400);
      returnObj.message = "Login failed";
      return res.json(returnObj);
    }

    /*const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    allowIp = await db.adminAllowIps.findByIp(ip)

    if (!allowIp) {
      res.status(400);
      returnObj.message = "Login failed";
      return res.json(returnObj);
    }*/

  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "API Error";
    return res.json(returnObj);
  }

  if (user) {
    const returnData = { accessToken: user }
    returnObj.status = "success";
    returnObj.data = returnData;
  }

  return res.json(returnObj);
}

async function getAdminUserInfo(req, res) {
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

  let allowIp;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    /*const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    /allowIp = await db.adminAllowIps.findByIp(ip)

    if (!allowIp) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }*/
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

async function getAdminAllUsers(req, res) {
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

  let adminList;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    adminList = await db.adminUsers.getAllUsers();
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = adminList;

  return res.json(returnObj);
}

async function registerAdminUser(req, res) {
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

  let registerUser;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    registerUser = await db.adminUsers.registerUser(req.body);
    if (!registerUser) {
      res.status(400);
      returnObj.message = "Register Error";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = registerUser;

  return res.json(returnObj);
}

async function modifyAdminUser(req, res) {
  let { user } = req;
  let { id, password, name, level, permissions, active } = req.body;

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

  let modifyUser;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    modifyUser = await db.adminUsers.findById(id);
    modifyUser.name = name;
    modifyUser.level = level;
    modifyUser.permissions = permissions;
    modifyUser.active = active;
    if (password !== "") {
      const passwordHash = await bcrypt.createPasswordHash(password);
      modifyUser.password = passwordHash;
    }
    modifyUser.save();
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = modifyUser;

  return res.json(returnObj);
}

async function deleteAdminUser(req, res) {
  let { user } = req;
  let { id } = req.body;

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

  let deleteUser;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    deleteUser = await db.adminUsers.deleteUser(id);
    if (!deleteUser) {
      res.status(400);
      returnObj.message = "Delete Error";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = deleteUser;

  return res.json(returnObj);
}

async function registerAppProperty(req, res) {
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

  let registerProperty = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.permissions.properties) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    registerProperty = await db.appProperty.registerAppProperty(req.body);
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = registerProperty;

  return res.json(returnObj);
}

async function updateAppProperty(req, res) {
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

  let updateProperty = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.permissions.properties && req.body.keyName !== "lock_up_all") {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.permissions.lockUpAll && req.body.keyName === "lock_up_all") {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    updateProperty = await db.appProperty.updateAppProperty(req.body);
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = updateProperty;

  return res.json(returnObj);
}

async function getAllUsers(req, res) {
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

  let users = null;
  let total = null;
  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    users = await db.users.getAllUsers();
    total = users.length;

  } catch(e) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    users,
    total
  };

  return res.json(returnObj);
}

async function getUserList(req, res) {
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

  let result = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    result = await db.users.findBySearchObj(req.query);

  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    users: result.users,
    total: result.total,
    pageable: {
      page: (Number(req.query.page) === 1 || Number(req.query.page) === 0) ? 0 : Number(req.query.page) - 1,
      size: Number(req.query.size),
    },
  };

  return res.json(returnObj);
}

async function setLockUp(req, res) {
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

  let setLockUp = null;

  try {
    user = await db.users.findById(user.id);

    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.isAdmin) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    setLockUp = await db.users.setLockUp(req.body);

  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = setLockUp;

  return res.json(returnObj);
}

async function modifyUser(req, res) {
  let { user } = req;
  let { id, emailAddress, password, pinCode, name, userId, phoneNumber } = req.body;

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

  let modifyUser;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    modifyUser = await db.users.findById(id);
    modifyUser.emailAddress = emailAddress;
    modifyUser.name = name;
    modifyUser.userId = userId;
    modifyUser.phoneNumber = phoneNumber;
    if (password !== "") {
      const passwordHash = await bcrypt.createPasswordHash(password);
      modifyUser.password = passwordHash;
    }

    if (pinCode !== "") {
      const pinCodeHash = await bcrypt.createPasswordHash(pinCode);
      modifyUser.pinCode = pinCodeHash;
    }
    modifyUser.save();
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = modifyUser;

  return res.json(returnObj);
}

async function getAdminAllowIps(req, res) {
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

  let adminAllowIps;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    adminAllowIps = await db.adminAllowIps.getAllowIps();
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  returnObj.status = "success";
  returnObj.data = {
    adminAllowIps,
    myIp: ip
  };

  return res.json(returnObj);
}

async function deleteAdminIp(req, res) {
  let { user } = req;
  let { id } = req.body;

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

  let deleteIp;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    deleteIp = await db.adminAllowIps.deleteIp(id);
    if (!deleteIp) {
      res.status(400);
      returnObj.message = "Delete Error";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = deleteIp;

  return res.json(returnObj);
}

async function registerAdminIp(req, res) {
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

  let registerIp;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level !== 10) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    registerIp = await db.adminAllowIps.registerIp(req.body);
    if (!registerIp) {
      res.status(400);
      returnObj.message = "Register Error";
      return res.json(returnObj);
    }
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = registerIp;

  return res.json(returnObj);
}

async function airdrop(req, res) {
  let { user } = req;
  const { receiveAddress, amount, sideTokenSymbol } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const validateCheck = joi.airDropCheck(req.body);

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

  let adminAddress = null;
  let sendResult = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level < 5) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    adminAddress = await db.appProperty.findByKey("admin_address");
    const sendObj = {
      from: adminAddress.value,
      to: receiveAddress,
      amount: parseFloat(amount),
      sideTokenSymbol,
      whereSend: "adminSend"
    }

    sendResult = await luniverse.sendTokenV2(sendObj);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "Send failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function airdropBack(req, res) {
  let { user } = req;
  const { receiveAddress, amount, sideTokenSymbol } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const validateCheck = joi.airDropCheck(req.body);

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

  let adminAddress = null;
  let sendResult = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level < 5) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    adminAddress = await db.appProperty.findByKey("admin_address");
    const sendObj = {
      from: receiveAddress,
      to: adminAddress.value,
      amount: parseFloat(amount),
      sideTokenSymbol,
      whereSend: "adminReceive"
    }

    sendResult = await luniverse.sendTokenV2(sendObj);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "Send failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function airdropWithId(req, res) {
  let { user } = req;
  const { userId, amount, sideTokenSymbol } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const validateCheck = joi.airDropWithIdCheck(req.body);

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

  let adminAddress = null;
  let sendResult = null;
  let getUserAddress = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level < 5) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    getUserAddress = await db.users.findByUserId(userId);

    if (!getUserAddress) {
      res.status(400);
      returnObj.message = "Send failed";
      return res.json(returnObj);
    }

    adminAddress = await db.appProperty.findByKey("admin_address");

    const sendObj = {
      from: adminAddress.value,
      to: getUserAddress.address,
      amount: parseFloat(amount),
      sideTokenSymbol,
      whereSend: "adminSend"
    }

    sendResult = await luniverse.sendTokenV2(sendObj);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "Send failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function airdropBackWithId(req, res) {
  let { user } = req;
  const { userId, amount, sideTokenSymbol } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const validateCheck = joi.airDropWithIdCheck(req.body);

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

  let adminAddress = null;
  let sendResult = null;
  let getUserAddress = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (user.level < 5) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    getUserAddress = await db.users.findByUserId(userId);

    if (!getUserAddress) {
      res.status(400);
      returnObj.message = "Send failed";
      return res.json(returnObj);
    }

    adminAddress = await db.appProperty.findByKey("admin_address");
    const sendObj = {
      from: getUserAddress.address,
      to: adminAddress.value,
      amount: parseFloat(amount),
      sideTokenSymbol,
      whereSend: "adminReceive"
    }

    sendResult = await luniverse.sendTokenV2(sendObj);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "Send failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = true;

  return res.json(returnObj);
}

async function getAllTransactions(req, res) {
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

  let transactions = null;
  let total = null;
  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.permissions.transferHistory) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    transactions = await db.transactions.getAllTransactions();
    total = transactions.length;

  } catch(e) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    transactions,
    total
  };

  return res.json(returnObj);
}

async function getTransactionList(req, res) {
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

  let result = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    if (!user.permissions.transferHistory) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    result = await db.transactions.findBySearchObj(req.query);

  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    transactions: result.transactions,
    total: result.total,
    pageable: {
      page: (Number(req.query.page) === 1 || Number(req.query.page) === 0) ? 0 : Number(req.query.page) - 1,
      size: Number(req.query.size),
    },
  };

  return res.json(returnObj);
}

async function getAllCouponPurchaseHistory(req, res) {
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

  let purchases = null;
  let total = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    purchases = await db.market.getAllPurchase();
    total = purchases.length;

  } catch(e) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    purchases,
    total
  };

  return res.json(returnObj);
}

async function getCouponPurchaseHistory(req, res) {
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

  let result = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    result = await db.market.findBySearchObj(req.query);

  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = {
    purchases: result.purchases,
    total: result.total,
    pageable: {
      page: (Number(req.query.page) === 1 || Number(req.query.page) === 0) ? 0 : Number(req.query.page) - 1,
      size: Number(req.query.size),
    },
  };

  return res.json(returnObj);
}

async function registerNotice(req, res) {
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

  let registerNotice = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    registerNotice = await db.notice.registerNotice(req.body);
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = registerNotice;

  return res.json(returnObj);
}

async function updateNotice(req, res) {
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

  let updateNotice = null;

  try {
    user = await db.adminUsers.findById(user.id);
    if (!user) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    updateNotice = await db.notice.updateNotice(req.body);
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = updateNotice;
  return res.json(returnObj);
}

module.exports = {
  login,
  getAdminUserInfo,
  getAdminAllUsers,
  registerAdminUser,
  modifyAdminUser,
  deleteAdminUser,
  registerAppProperty,
  updateAppProperty,
  getAllUsers,
  setLockUp,
  getUserList,
  modifyUser,
  getAdminAllowIps,
  deleteAdminIp,
  registerAdminIp,
  airdrop,
  airdropBack,
  airdropWithId,
  airdropBackWithId,
  getAllTransactions,
  getTransactionList,
  registerNotice,
  updateNotice,
  getAllCouponPurchaseHistory,
  getCouponPurchaseHistory,
}
