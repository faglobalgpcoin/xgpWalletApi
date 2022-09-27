const request = require("request-promise-native");
const cryptoRandomString = require("crypto-random-string");
const web3 = require("web3");
const { v4: uuidv4 } = require("uuid");

const redis = require("../redis");
const config = require("../../config");
const db = require("../sql");
const {get} = require("../redis");

const { apiKey, apiUrl, scanApiUrl, mt, v2 } = config.luniverse;
let token = null;

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

async function getAuthToken() {
  const reqParams = {
    url: v2.apiUrl + "/auth-tokens",
    method: "POST",
    json: {
      accessKey: config.luniverse.v2.accessKey,
      secretKey: config.luniverse.v2.secretKey,
      expiresIn: 100
    }
  }

  let res = null;
  try {
    res = await request(reqParams);
    if (res.result) {
      res = res.data.authToken.token;
      token = res;
    }
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function createWallet() {
  const privateKey = cryptoRandomString({ length: 66 });
  const reqParams = {
    url: apiUrl + "/wallets",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    method: "POST",
    json: {
      walletType: "LUNIVERSE",
      userKey: privateKey
    }
  }

  let res = null;
  try {
    res = await request(reqParams);
    if (res.result) {
      const walletObj = {
        address: res.data.address,
        privateKey
      }
      const privKey = await db.privateKey.registerKey(walletObj);
      if (privKey) return walletObj;
    }
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function createWalletV2() {
  const privateKey = cryptoRandomString({ length: 66 });
  const reqParams = {
    url: v2.apiUrl + "/wallets",
    headers: {
      "Authorization": "Bearer " + token
    },
    method: "POST",
    json: {
      environmentId: v2.environmentId,
      userKey: privateKey
    }
  }

  let res = null;
  try {
    res = await request(reqParams);
    if (res.result) {
      const walletObj = {
        address: res.data.address,
        privateKey
      }
      const privKey = await db.privateKey.registerKey(walletObj);
      if (privKey) return walletObj;
    }
  } catch(e) {
    if (e.statusCode === 401) {
      await getAuthToken();
      res = await createWalletV2();
      return res;
    } else {
      console.log(e);
    }
  }

  return res;
}

async function getBalance(address, st) {
  const reqParams = {
    url: apiUrl + "/wallets/" + address + "/" + mt + "/" + st + "/balance",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    method: "GET"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
    if (res.result) {
      res = web3.utils.fromWei(res.data.balance, "ether")
    }
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function getBalanceV2(address, st) {
  const reqParams = {
    url: v2.apiUrl + "/wallets/" + address + "/" + mt + "/" + st + "/balance",
    headers: {
      "Authorization": "Bearer " + token
    },
    method: "GET"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
    if (res.result) {
      res = web3.utils.fromWei(res.data.balance, "ether")
    }
  } catch(e) {
    if (e.statusCode === 401) {
      await getAuthToken();
      res = await getBalanceV2(address, st);
      return res;
    } else {
      console.log(e);
    }
  }

  return res;
}

async function getOriBalance(address, st) {
  const reqParams = {
    url: apiUrl + "/wallets/" + address + "/" + mt + "/" + st + "/balance",
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    method: "GET"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
    if (res.result) {
      res = res.data.balance;
    }
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function getOriBalanceV2(address, st) {
  const reqParams = {
    url: v2.apiUrl + "/wallets/" + address + "/" + mt + "/" + st + "/balance",
    headers: {
      "Authorization": "Bearer " + token
    },
    method: "GET"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
    if (res.result) {
      res = res.data.balance;
    }
  } catch(e) {
    if (e.statusCode === 401) {
      await getAuthToken();
      res = await getOriBalanceV2(address, st);
      return res;
    } else {
      console.log(e);
    }
  }

  return res;
}

async function sendToken(obj) {
  const { from, to, amount, sideTokenSymbol, whereSend } = obj;

  const reqParams = {
    url: apiUrl + "/transactions/TransferFor" + sideTokenSymbol,
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    method: "POST",
    json: {
      from: from,
      inputs: {
        receiverAddress: to,
        valueAmount: web3.utils.toWei(amount.toString(), "ether")
      }
    }
  }

  let res = null;
  let tx = null;
  try {
    res = await request(reqParams);
    if (res.result) {
      tx = await db.transactions.registerTx({from, to, volume: amount, txid: res.data.txId, symbol: sideTokenSymbol, whereSend });
    }
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function sendTokenV2(obj) {
  const { from, to, amount, sideTokenSymbol, whereSend } = obj;
  const id = await uuidv4();

  const reqParams = {
    url: v2.apiUrl + "/transactions/TransferFor" + sideTokenSymbol + "V2",
    headers: {
      "Authorization": "Bearer " + token
    },
    method: "POST",
    json: {
      txId: id,
      from: from,
      inputs: {
        _to: to,
        _value: web3.utils.toWei(amount.toString(), "ether")
      }
    }
  }

  let res = null;
  let tx = null;
  try {
    res = await request(reqParams);
    if (res.result) {
      tx = await db.transactions.registerTx({from, to, volume: amount, txid: res.data.txId, symbol: sideTokenSymbol, whereSend });
    }
  } catch(e) {
    console.log(e);
    if (e.statusCode === 401) {
      await getAuthToken();
      res = await sendTokenV2(obj);
      return res;
    } else {
      console.log(e);
    }
  }

  return res;
}

async function sendToken2(obj) {
  const { from, to, amount, sideTokenSymbol } = obj;

  const reqParams = {
    url: apiUrl + "/transactions/TransferFor" + sideTokenSymbol,
    headers: {
      "Authorization": "Bearer " + apiKey
    },
    method: "POST",
    json: {
      from: from,
      inputs: {
        receiverAddress: to,
        valueAmount: web3.utils.toWei(amount.toString(), "ether")
      }
    }
  }

  let res = null;
  try {
    res = await request(reqParams);
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function getTokenInfo() {
  const reqParams = {
    url: scanApiUrl + "/tokens?page=1&rpp=25"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
  } catch(e) {
    console.log(e);
  }

  return res;
}

async function getTransactions(address) {
  const reqParams = {
    url: scanApiUrl + "/accounts/" + address + "/transfer-events?limit=500"
  }

  let res = null;
  try {
    res = await request(reqParams);
    res = JSON.parse(res);
    res = res.data.transferEvents.items;
  } catch(e) {
    console.log(e);
  }

  return res;
}

(async function getPrice() {
  const options = {
    url: "https://api.probit.com/api/exchange/v1/ticker?market_ids=XGP-USDT"
  };

  const options2 = {
    url: "https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD"
  }

  let res = null;
  let last = null;
  let res2 = null;
  let cur = null;

  try {
    res = await request(options);
    res = JSON.parse(res);
    res = res.data[0];
    res2 = await request(options2);
    res2 = JSON.parse(res2);
    res2 = res2[0];

    cur = res2.basePrice * res.last;
    last = cur;

    if (res) {
      await redis.set("xgpPrice", last);
    }
  } catch(e) {
    console.log(e);
    await waitFor(5000);
    await getPrice();
  }

  await waitFor(5000);
  await getPrice();
})();

(async function getTxid() {
  let transactions;
  let res;
  try {
    await getAuthToken();
    transactions = await db.transactions.getNotConvertedTransactions();
    if (transactions.length > 0)
      console.log(transactions.length);
    await asyncForEach(transactions, async(transaction) => {
      const fromUser = await db.users.findByLuniverseAddress(transaction.from);
      const toUser = await db.users.findByLuniverseAddress(transaction.to);
      if (fromUser) {
        transaction.fromUserId = fromUser.userId;
        transaction.save();
      }
      if (toUser) {
        transaction.toUserId = toUser.userId;
        transaction.save();
      }

      const params = {
        url: v2.apiUrl + "/transactions",
        headers: {
          "Authorization": "Bearer " + token
        },
        json: {
          environmentId: v2.environmentId,
          txId: transaction.txid
        }
      }

      try {
        res = await request(params);
        const txData = res.data.transaction;

        if (txData.txStatus === 'SUCCEED' || txData.txStatus === 'FAILED') {
          transaction.txHash = txData.txHash;
          transaction.blockHash = txData.blockHash;
          transaction.converted = true;
          transaction.status = txData.txReceipt.status;
          transaction.save();
          console.log(txData.txId + ' ' + txData.txStatus +'updated!!!');
        }
      } catch (e) {
        if (e.error) console.log(e.error);
        console.log(e);
      }
    });
  } catch (e) {
    console.log(e);
    await waitFor(1000);
    await getTxid();
  }
  await waitFor(1000);
  await getTxid();
})();

(async function moveToken() {
  let getAllowanceAddress;
  let getSalesAddress;
  let allowanceAddress;
  let salesAddress;
  let getAllowanceBalance;
  let getAllowanceLimit;
  let allowanceLimit;
  let getSalesBalance;
  try {
    getAllowanceAddress = await db.appProperty.findByKey('allowance_address');
    allowanceAddress = getAllowanceAddress.value;
    getSalesAddress = await db.appProperty.findByKey('sales_address');
    salesAddress = getSalesAddress.value
    getAllowanceBalance = await getBalanceV2(allowanceAddress, "XGP");
    getAllowanceLimit = await db.appProperty.findByKey('allowanceLimit');
    allowanceLimit = getAllowanceLimit.value;
    getSalesBalance = await getBalanceV2(salesAddress, "XGP");

    if (parseFloat(getAllowanceBalance) < parseFloat(allowanceLimit)) {
      const sendObj = {
        from: salesAddress,
        to: allowanceAddress,
        amount: parseFloat(getSalesBalance),
        sideTokenSymbol: "XGP",
        whereSend: "automaticSend"
      }
      await sendTokenV2(sendObj);
    }
  } catch(e) {
    await waitFor(1000);
    await moveToken();
  }
  await waitFor(1000);
  await moveToken();
})();

module.exports = {
  createWallet: createWallet,
  getBalance: getBalance,
  getOriBalance: getOriBalance,
  getTransactions: getTransactions,
  sendToken: sendToken,
  getTokenInfo: getTokenInfo,
  sendToken2: sendToken2,
  //V2
  createWalletV2,
  getOriBalanceV2,
  getBalanceV2,
  sendTokenV2,
}
