const db = require("../../../../lib/sql");
const luniverse = require("../../../../lib/luniverse");
const ethereum = require("../../../../lib/ethereum");
const bitcoin = require("../../../../lib/bitcoin");
const redis = require("../../../../lib/redis");

const moveDown = (contents, value) => {
  const index = contents.indexOf(value);
  let newPos = index + 1;
  if (index === -1)
    throw new Error("Element not found in  content");

  const newContents = JSON.parse(JSON.stringify(contents));
  if (newPos >= contents.length) newPos = contents.length;
  newContents.splice(index, 1);
  newContents.splice(newPos, 0, value);
  return newContents;
};
async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function getAppProperties(req, res) {
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

  let appProperties = null;
  try {
    appProperties = await db.appProperty.getProperties();
    const ethTransferFee = appProperties.find((i) => i.keyName === "ETH_transfer_fee");
    ethTransferFee.value = await ethereum.getGasPrice();



    const btcTransferFee = appProperties.find((i) => i.keyName === "BTC_transfer_fee");
    user = await db.users.findById(user.id);
    if (user) btcTransferFee.value = await bitcoin.getTransferFee(user.btcAddress);

    const xgpPrice = await redis.get("xgpPrice");
    const xgpDbPrice = appProperties.find((i) => i.keyName === "XGP_token_price");
    xgpDbPrice.value = xgpPrice;
    const ethereumPrice = await redis.get("ethereumPrice");
    const ethPrice = appProperties.find((i) => i.keyName === "ETH_token_price");
    ethPrice.value = ethereumPrice;
    const bitcoinPrice = await redis.get("bitcoinPrice");
    const btcPrice = appProperties.find((i) => i.keyName === "BTC_token_price");
    btcPrice.value = bitcoinPrice;
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = appProperties;

  return res.json(returnObj);
}

async function getAppProperty(req, res) {
  let { user } = req;
  let { keyName } = req.query;

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

  let appProperty = null;
  try {
    appProperty = await db.appProperty.findByKey(keyName);
  } catch(e) {
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = appProperty;

  return res.json(returnObj);
}

async function getNotices(req, res) {
  let { user } = req;
  let { inuse } = req.params;

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

  let notices = null;

  let checkUser;
  try {
    checkUser = await db.users.findById(user.id);
    if (!checkUser) checkUser = await db.adminUsers.findById(user.id);
    if (!checkUser) {
      res.status(401);
      returnObj.message = "Unauthorized Access";
      return res.json(returnObj);
    }

    notices = await db.notice.getNotices(inuse);
  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = notices;

  return res.json(returnObj);
}

async function getTokenInfo(req, res) {
  const returnObj = {
    status: "fail",
    message: null,
    data: null,
    timeStamp: parseInt(new Date().getTime() / 1000)
  }

  let info = null;
  try {
    info = [];
    const luniTokens = await luniverse.getTokenInfo();
    luniTokens.data.tokens.items.forEach((item) => {
      const obj = {
        name: item.name,
        imageUrl: item.imageUrl,
        decimals: item.decimals,
        symbol: item.symbol,
        type: "luniverse"
      }
      if (item.symbol === "XGP")
        info.push(obj);
    });

    const ethTokens = await ethereum.getTokenInfo();
    ethTokens.forEach((item) => {
      const obj = {
        name: item.name,
        imageUrl: item.imageUrl,
        decimals: item.decimals,
        symbol: item.symbol,
        type: "ethereum"
      }
      info.push(obj);
    });

    const bitcoinObj = {
      name: "Bitcoin",
      imageUrl: "https://cryptologos.cc/logos/bitcoin-btc-logo.png?v=004",
      decimals: 8,
      symbol: "BTC",
      type: "bitcoin"
    }
    info.push(bitcoinObj);

  } catch(e) {
    console.log(e);
    res.status(401);
    returnObj.message = "Unauthorized Access";
    return res.json(returnObj);
  }

  returnObj.status = "success";
  returnObj.data = info;
  return res.json(returnObj);
}

async function test(req, res) {
  const { userId, phoneNumber, address } = req.body;

  //const privateKey = await db.privateKey.getPrivateKey(address);
  //let privateKeyToBuffer = Buffer.from(privateKey.substr(2), "hex");

  const wallet = await bitcoin.createWallet();

  /*let getOldMemberAddress = await db.oldMember.getAddress({userId, phoneNumber});
  let getBalance = await db.oldTransactions.getBalance(getOldMemberAddress);*/
  //let wallet = await luniverse.createWallet();
  /*const tokenBalance = await ethereum.getBalance(address, "LES");

  const gasPrice = await ethereum.getGasPrice();*/

  //let getOldMemberAddress = await db.oldMember.getAddress({userId: 'heidijeanlee', phoneNumber: '821046370110'});
  //let getBalance = await db.oldTransactions.getBalance(getOldMemberAddress);

  /*let getOldTransactions = await db.transactions.getOldTransactions();
  await asyncForEach(getOldTransactions, async(transaction) => {
    let getBalance = await luniverse.getBalance(transaction.to, "XGP");
    console.log(getBalance);
    const obj = {
      from: transaction.to,
      amount: getBalance,
      to: '0xe79568e6d9c2876fa403a97c9c1d4826c81c2c68',
      sideTokenSymbol: 'XGP',
    }

    let send = await luniverse.sendToken2(obj);
    console.log(send);
    await waitFor(50);
  });*/
  return res.json(wallet);
}

async function test2(req, res) {
  const { address } = req.body;
  let getBalance = await luniverse.getBalanceV2('0x51b0cac26f330fb727244651fe407242babf0ce9', "XGP");
  console.log(getBalance);
  const sendObj = {
    from: "0x51b0cac26f330fb727244651fe407242babf0ce9",
    to: address,
    amount: parseFloat(getBalance),
    sideTokenSymbol: "XGP"
  }

  const sendResult = await luniverse.sendTokenV2(sendObj);
  return res.json(sendResult);
}

async function test3(req, res) {
  const { address } = req.body;
  const balance = await ethereum.getBalance(address, "ETH");
  const gasPrice = await ethereum.getGasPrice();
  const gas = parseInt(gasPrice * 1000000000) * 21000;
  const amount = ((balance * 1000000000) - gas) / 1000000000;
  console.log(gas);
  console.log(balance);
  console.log(amount);
  const sendObj = {
    from: address,
    to: "15csRgbU3KEf4x5HUwz6DEGZAi2e8PjmWM",
    amount: parseFloat(amount),
    sideTokenSymbol: "ETH"
  }

  const sendResult = await ethereum.sendToken(sendObj);
  return res.json({gas, balance, amount, sendResult});
  //return res.json({sendResult});
}

module.exports = {
  getAppProperties: getAppProperties,
  getAppProperty: getAppProperty,
  getNotices: getNotices,
  getTokenInfo: getTokenInfo,
  test,
  test2
}
