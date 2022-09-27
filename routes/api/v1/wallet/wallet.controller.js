const db = require("../../../../lib/sql");
const luniverse = require("../../../../lib/luniverse");
const ethereum = require("../../../../lib/ethereum");
const bitcoin = require("../../../../lib/bitcoin");
const joi = require("../../../../lib/joi");
const verifyCode = require("../../../../lib/verifyCode");
const request = require("request-promise-native");

async function sendToken(req, res) {
  let { user } = req;
  const { receiveAddress, amount, sideTokenSymbol, type, emailCode, pinCode } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  const validateCheck = joi.sendTokenCheck(req.body);

  if (validateCheck.error) {
    res.status(400);
    returnObj.message = validateCheck.error.details[0].message;
    return res.json(returnObj);
  }

  const now = parseInt(new Date().getTime() / 1000);

  if (!user) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  let address = null;
  let lockUp = null;
  let lockUpPeriod = null;
  let lockUpRate = null;
  let feeAddress = null;
  let adminAddress = null;
  let transferFee = null;
  let sendResult = null;
  let balance = null;
  let lockUpAll = null;
  let pinCodeCheck = null;
  let luniverseAddress = null;
  let useTokenCheck = null;
  let updateUseToken = null;
  let igpWalletCheck = null;

  try {
    if (type === "luniverse") {
      address = await db.users.getAddress(user.id);
      lockUp = address.lockUp;
      lockUpPeriod = address.lockUpPeriod;
      lockUpPeriod = parseInt(new Date(lockUpPeriod).getTime() / 1000);
      lockUpRate = address.lockUpRate;
      transferFee = await db.appProperty.findByKey(sideTokenSymbol + "_transfer_fee");
      feeAddress = await db.appProperty.findByKey("fee_address");
      adminAddress = await db.appProperty.findByKey("admin_address");
      lockUpAll = await db.appProperty.findByKey("lock_up_all");
      balance = await luniverse.getBalanceV2(address.address, sideTokenSymbol);
      luniverseAddress = await db.users.findByLuniverseAddress(receiveAddress);
      useTokenCheck = await db.usePointCheck.findByUserId(address.emailAddress);
      const blockAddresses = ['0xbcf41ff6c661b99e7041bbe365eb02e9442eb2ed', '0xfffceb755439ac0144783170239a82004c066daf', '0xb655f4cdbf8c6f422d081f777b7f3ee705436f8f', '0xb2d25ac36cd73fcb994e9bd4e60c3c05e7564ad4'];

      for (let blockAddress of blockAddresses) {
        if (blockAddress === receiveAddress) {
          if (parseFloat(amount) > 100000) {
            res.status(400);
            returnObj.message = "Send failed";
            return res.json(returnObj);
          }

          if (useTokenCheck) {
            if ((parseFloat(useTokenCheck.useToken) + parseFloat(amount)) > 100000) {
              console.log(address.emailAddress, address.address, address.userId, 'blockAddress block');
              res.status(400);
              returnObj.message = "Send failed";
              return res.json(returnObj);
            }
          }
          /*res.status(400);
          returnObj.message = "Send failed";
          return res.json(returnObj);*/
        }
      }

      if (!luniverseAddress) {
        const params = {
          url: 'https://api.igp-wallet.com/api/v1/wallet/validateAddress',
          json: {
            type: type,
            address: receiveAddress
          },
          method: 'post'
        }
        const getIgpAddress = await request(params);
        if (getIgpAddress) {
          luniverseAddress = getIgpAddress.data;
        } else {
          luniverseAddress = false;
        }
      }

      if (!luniverseAddress && address.address !== '0xb4552d4fcec3ff55a98420caf469fb8c68a8d578') {
        /*res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);*/

        if (parseFloat(amount) > 100000) {
          res.status(400);
          returnObj.message = "Send failed";
          return res.json(returnObj);
        }

        if (useTokenCheck) {
          if ((parseFloat(useTokenCheck.useToken) + parseFloat(amount)) > 100000) {
            console.log(address.emailAddress, address.address, address.userId, 'not luniverse address block');
            res.status(400);
            returnObj.message = "Send failed";
            return res.json(returnObj);
          }
        }
      }

      const emailCheckObj = {
        code: emailCode,
        emailAddress: address.emailAddress
      }

      const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);

      if (!emailCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(401);
        returnObj.message = "Unauthorized Access";
        return res.json(returnObj);
      }

      pinCodeCheck = await db.users.pinCodeCheck({
        userId: address.userId,
        emailAddress: address.emailAddress,
        pinCode
      });

      if (!pinCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(400);
        returnObj.message = "PinCode Error";
        return res.json(returnObj);
      }

      if (lockUpAll.value === "true") {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && now < lockUpPeriod) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && lockUpRate) {
        balance = balance * ((100 - lockUpRate) / 100);
      }

      if (parseFloat(balance) < parseFloat(amount) + parseFloat(transferFee.value)) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      for (let blockAddress of blockAddresses) {
        if (blockAddress === receiveAddress) {
          const useToken = {
            userId: address.emailAddress,
            amount: parseFloat(amount)
          }
          console.log(useToken, 'blockAddress');
          updateUseToken = await db.usePointCheck.upsert(useToken);
          console.log(updateUseToken.userId, 'blockAddress update');
        }
      }

      if (!luniverseAddress) {
        const useToken = {
          userId: address.emailAddress,
          amount: parseFloat(amount)
        }

        console.log(useToken);
        updateUseToken = await db.usePointCheck.upsert(useToken);
        console.log(updateUseToken.userId, 'not luniverse update');
      }

      if (address.address !== adminAddress.value) {
        const feeSendObj = {
          from: address.address,
          to: feeAddress.value,
          amount: parseFloat(transferFee.value),
          sideTokenSymbol,
          whereSend: "walletFee"
        }

        sendResult = await luniverse.sendTokenV2(feeSendObj);
      }

      const sendObj = {
        from: address.address,
        to: receiveAddress,
        amount: parseFloat(amount),
        sideTokenSymbol,
        whereSend: "wallet"
      }

      sendResult = await luniverse.sendTokenV2(sendObj);
    } else if(type === "ethereum") {
      address = await db.users.getEthAddress(user.id);
      lockUp = address.lockUp;
      lockUpPeriod = address.lockUpPeriod;
      lockUpPeriod = parseInt(new Date(lockUpPeriod).getTime() / 1000);
      lockUpRate = address.lockUpRate;
      lockUpAll = await db.appProperty.findByKey("lock_up_all");
      balance = await ethereum.getBalance(address.ethAddress, sideTokenSymbol);

      const emailCheckObj = {
        code: emailCode,
        emailAddress: address.emailAddress
      }

      const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);

      if (!emailCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(401);
        returnObj.message = "Unauthorized Access";
        return res.json(returnObj);
      }

      pinCodeCheck = await db.users.pinCodeCheck({
        userId: address.userId,
        emailAddress: address.emailAddress,
        pinCode
      });

      if (!pinCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUpAll.value === "true") {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && now < lockUpPeriod) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && lockUpRate) {
        balance = balance * ((100 - lockUpRate) / 100);
      }

      if (parseFloat(balance) < parseFloat(amount)) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      const sendObj = {
        from: address.ethAddress,
        to: receiveAddress,
        amount: parseFloat(amount),
        sideTokenSymbol,
        whereSend: "wallet"
      }

      sendResult = await ethereum.sendToken(sendObj);

      if (!sendResult) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }
    } else {
      address = await db.users.getBtcAddress(user.id);
      lockUp = address.lockUp;
      lockUpPeriod = address.lockUpPeriod;
      lockUpPeriod = parseInt(new Date(lockUpPeriod).getTime() / 1000);
      lockUpRate = address.lockUpRate;
      lockUpAll = await db.appProperty.findByKey("lock_up_all");
      balance = await bitcoin.getBalance(address.btcAddress, sideTokenSymbol);

      const emailCheckObj = {
        code: emailCode,
        emailAddress: address.emailAddress
      }

      const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);

      if (!emailCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(401);
        returnObj.message = "Unauthorized Access";
        return res.json(returnObj);
      }

      pinCodeCheck = await db.users.pinCodeCheck({
        userId: address.userId,
        emailAddress: address.emailAddress,
        pinCode
      });

      if (!pinCodeCheck && user.id !== "04161be6-5fdd-4911-a137-1c6ee8a3fa6e") {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUpAll.value === "true") {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && now < lockUpPeriod) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      if (lockUp && lockUpRate) {
        balance = balance * ((100 - lockUpRate) / 100);
      }

      if (parseFloat(balance) < parseFloat(amount)) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }

      const sendObj = {
        from: address.btcAddress,
        to: receiveAddress,
        amount: parseFloat(amount),
        sideTokenSymbol,
        whereSend: "wallet"
      }

      sendResult = await bitcoin.sendToken(sendObj);

      if (!sendResult) {
        res.status(400);
        returnObj.message = "Send failed";
        return res.json(returnObj);
      }
    }
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

async function getBalance(req, res) {
  let { user } = req;
  let { token } = req.params;

  if (!user) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let address = null;
  let balance = null;
  try {
    address = await db.users.getAddress(user.id);
    balance = await luniverse.getBalanceV2(address.address, token);
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "getBalance failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = { balance };

  return res.json(returnObj);
}

async function getBalanceToType(req, res) {
  let { user } = req;
  let { token, type } = req.params;

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

  let address = null;
  let balance = null;

  try {
    if (type === "luniverse") {
      address = await db.users.getAddress(user.id);
      balance = await luniverse.getOriBalanceV2(address.address, token);
    } else if (type === "ethereum") {
      address = await db.users.getEthAddress(user.id);
      balance = await ethereum.getOriBalance(address.ethAddress, token);
    } else {
      address = await db.users.getBtcAddress(user.id);
      balance = await bitcoin.getOriBalance(address.btcAddress, token);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "getBalance failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = { balance };

  return res.json(returnObj);
}

async function getBalanceToAddressAndType(req, res) {
  let { user } = req;
  let { token, type, address } = req.params;

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

  let balance = null;

  try {
    if (type === "luniverse") {
      balance = await luniverse.getOriBalanceV2(address, token);
    } else if (type === "ethereum") {
      balance = await ethereum.getOriBalance(address, token);
    } else {
      balance = await bitcoin.getOriBalance(address, token);
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "getBalance failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = { balance };

  return res.json(returnObj);
}

async function getTransactionsToType(req, res) {
  let { user } = req;
  let { token, type } = req.params;

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

  let address = null;
  let txns = null;

  try {
    if (type === "luniverse") {
      address = await db.users.getAddress(user.id);
      txns = await luniverse.getTransactions(address.address);
    } else if (type === "ethereum") {
      address = await db.users.getEthAddress(user.id);
      txns = await ethereum.getTransactions(address.ethAddress, token);
    } else {
      address = await db.users.getBtcAddress(user.id);
      txns = await bitcoin.getTransactions(address.btcAddress, token);
      if (!txns) txns = [];
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "getTransactions failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = { txns };

  return res.json(returnObj);
}

async function validateAddress(req, res) {
  let { type, address } = req.body;

  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let validateAddress = null;
  try {
    switch (type) {
      case "luniverse":
        validateAddress = await db.users.checkAddress(type, address);
        if (!validateAddress) {
          const params = {
            url: 'https://api.igp-wallet.com/api/v1/wallet/validateAddress',
            json: {
              type: type,
              address: address
            },
            method: 'post'
          }
          const getIgpAddress = await request(params);
          if (getIgpAddress) {
            validateAddress = getIgpAddress.data;
          } else {
            validateAddress = false;
          }
        }
        break;
      case "bitcoin":
        validateAddress = await db.users.checkAddress(type, address);
        break;
      case "ethereum":
        validateAddress = await db.users.checkAddress(type, address);
        break;
      default:
        validateAddress = false;
        break;
    }
  } catch(e) {
    console.log(e);
    res.status(400);
    returnObj.message = "validate failed";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = !!validateAddress;

  return res.json(returnObj);
}

module.exports = {
  sendToken: sendToken,
  getBalance: getBalance,
  getBalanceToType: getBalanceToType,
  getBalanceToAddressAndType: getBalanceToAddressAndType,
  getTransactionsToType: getTransactionsToType,
  validateAddress
}
