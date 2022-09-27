const wallet = require("ethereumjs-wallet");
const Web3 = require("web3");
const request = require("request-promise-native");
const Tx = require("ethereumjs-tx").Transaction;
const AWSHttpProvider = require('@aws/web3-http-provider');
const AWSWebsocketProvider = require('@aws/web3-ws-provider');

const config = require("../../config");
const db = require("../sql");
const tokenData = require("./tokens");
const abi = require("./abi");
const redis = require("../redis");

const credentials = {
  accessKeyId: config.aws.bcKey,
  secretAccessKey: config.aws.bcSecret
}

const endPoint = `https://${config.aws.bcNode}.ethereum.managedblockchain.${config.aws.bcRegion}.amazonaws.com`;
const wsEndPoint = `wss://${config.aws.bcNode}.wss.managedblockchain.${config.aws.bcRegion}.amazonaws.com`;
//const web3 = new Web3(Web3.givenProvider || new Web3.providers.HttpProvider(config.ethereum.web3.url));
const web3 = new Web3(new AWSHttpProvider(endPoint, credentials));
//const web3 = new Web3(new AWSWebsocketProvider(wsEndPoint, { clientConfig: { credentials: credentials }}));

console.log(wsEndPoint);
web3.eth.getNodeInfo().then(console.log);

const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

function sendSignTransaction(raw) {
  return new Promise((res, rej) => {
    web3.eth.sendSignedTransaction(raw)
      .on('transactionHash', (hash) => res(hash))
      .on('error', (err) => {
        res(false);
        console.log(err);
      });
  });
}

async function createWallet() {
  const newWallet = wallet.generate();
  const address = await newWallet.getAddressString();
  const privateKey = await newWallet.getPrivateKeyString();

  const walletObj = {
    address: address,
    privateKey
  }

  const privKey = await db.privateKey.registerKey(walletObj);
  if (privKey) return walletObj;

  return null;
}

async function getBalance(address, symbol) {
  let balance;
  try {
    if (symbol !== "ETH") {
      const tokenInfo = tokenData.tokens.find((i) => i.symbol === symbol);
      const tokenContract = new web3.eth.Contract(abi, tokenInfo.contractAddress);
      const tokenBalance = await tokenContract.methods.balanceOf(address).call();
      balance = web3.utils.fromWei(tokenBalance, "ether")
    } else {
      balance = await web3.eth.getBalance(address);
      balance = web3.utils.fromWei(balance, "ether")
    }
  } catch (e) {
    console.log(e);
    return 0;
  }
  return balance;
}

async function getOriBalance(address, symbol) {
  let tokenBalance;
  try {
    if (symbol !== "ETH" && symbol !== "BTC") {
      const tokenInfo = tokenData.tokens.find((i) => i.symbol === symbol);
      const tokenContract = new web3.eth.Contract(abi, tokenInfo.contractAddress);
      tokenBalance = await tokenContract.methods.balanceOf(address).call();
    } else {
      tokenBalance = await web3.eth.getBalance(address);
    }
  } catch(e) {
    console.log(e);
    return 0;
  }

  return tokenBalance;
}

async function getTransactions(address, symbol) {
  let res = null;

  if (symbol !== "ETH") {
    const tokenInfo = tokenData.tokens.find((i) => i.symbol === symbol);

    const reqParams = {
      url: "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=" + tokenInfo.contractAddress +
        "&address=" + address + "&page=1&offset=100&sort=desc&apikey=MVBVMK4WKW3ZQ9YI2952F5QGCBT8QWC4DZ",
    }

    res = null;
    try {
      res = await request(reqParams);
      res = JSON.parse(res);
      res = res.result;
    } catch (e) {
      console.log(e);
    }
  } else {
    const reqParams = {
      url: "https://api.etherscan.io/api?module=account&action=txlist" +
        "&address=" + address + "&page=1&offset=100&sort=desc&apikey=MVBVMK4WKW3ZQ9YI2952F5QGCBT8QWC4DZ",
    }
    res = null;
    try {
      res = await request(reqParams);
      res = JSON.parse(res);
      res = res.result;
    } catch (e) {
      console.log(e);
    }
  }

  return res;
}

async function getTokenInfo() {
  const tokens = tokenData.tokens;
  return tokens;
}

async function sendToken(obj) {
  const { from, to, amount, sideTokenSymbol, whereSend } = obj;

  let gasPrice = null;
  let transaction;

  try {
    gasPrice = await web3.eth.getGasPrice();
    gasPrice = web3.utils.fromWei(gasPrice, "gwei");
    gasPrice = parseFloat(gasPrice) + 5;
    gasPrice = web3.utils.toWei(parseInt(gasPrice).toString(), "gwei");
    gasPrice = web3.utils.toHex(gasPrice);
  } catch (e) {
    console.log(e);
    return false;
  }

  const txCount = await web3.eth.getTransactionCount(from);
  const amountToWei = web3.utils.toWei(parseFloat(amount).toString(), "ether");
  const privateKey = await db.privateKey.getPrivateKey(from);
  let privateKeyToBuffer = Buffer.from(privateKey.substr(2), "hex");

  if (sideTokenSymbol !== "ETH") {
    const tokenInfo = tokenData.tokens.find((i) => i.symbol === sideTokenSymbol);
    const tokenContract = new web3.eth.Contract(abi, tokenInfo.contractAddress);

    const sendData = tokenContract.methods.transfer(to, amountToWei).encodeABI();

    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: tokenInfo.contractAddress,
      value: web3.utils.toHex(web3.utils.toWei("0", "ether")),
      gasLimit: web3.utils.toHex(100000),
      gasPrice: gasPrice,
      data: sendData,
    }
    const tx = new Tx(txObject);
    tx.sign(privateKeyToBuffer);
    const serializedTx = tx.serialize();
    const raw = "0x" + serializedTx.toString("hex");

    transaction = await sendSignTransaction(raw);
    let saveTx = await db.transactions.registerTx({from, to, volume: amount, txid: transaction, symbol: sideTokenSymbol, whereSend });
  } else {
    const txObject = {
      nonce: web3.utils.toHex(txCount),
      to: to,
      value: web3.utils.toHex(amountToWei),
      gasLimit: web3.utils.toHex(21000),
      gasPrice: gasPrice,
      data: "0x",
    }

    const tx = new Tx(txObject);
    tx.sign(privateKeyToBuffer);
    const serializedTx = tx.serialize();
    const raw = "0x" + serializedTx.toString("hex");

    transaction = await sendSignTransaction(raw);
    let saveTx = await db.transactions.registerTx({from, to, volume: amount, txid: transaction, symbol: sideTokenSymbol, whereSend });
  }
  return transaction;
}

async function getGasPrice() {
  let gasPrice = 0;

  try {
    gasPrice = await web3.eth.getGasPrice();
    gasPrice = web3.utils.fromWei(gasPrice, "gwei");
    gasPrice = parseInt(parseFloat(gasPrice) + 5);
    gasPrice = web3.utils.toWei(gasPrice.toString(), "gwei");
    gasPrice = web3.utils.fromWei(gasPrice.toString(), "ether");
  } catch (e) {
    console.log(e);
    return 0;
  }

  return gasPrice;
}

(async function getPrice() {
  const options = {
    url: "https://api.bittrex.com/v3/markets/ETH-USD/ticker"
  };

  const options2 = {
    url: "https://quotation-api-cdn.dunamu.com/v1/forex/recent?codes=FRX.KRWUSD"
  }

  let res = null;
  let cur = null;

  try {
    res = await request(options);
    res = JSON.parse(res);
    cur = await request(options2);
    cur = JSON.parse(cur);
    cur = cur[0];
  } catch(e) {
    await waitFor(1000);
    await getPrice();
  }

  const last = cur.basePrice * res.lastTradeRate;

  if (res) {
    await redis.set("ethereumPrice", Math.round(last));
  }
  await waitFor(1000);
  await getPrice();
})();


module.exports = {
  createWallet: createWallet,
  getBalance: getBalance,
  getOriBalance: getOriBalance,
  getTransactions: getTransactions,
  getTokenInfo: getTokenInfo,
  sendToken: sendToken,
  getGasPrice: getGasPrice
}
