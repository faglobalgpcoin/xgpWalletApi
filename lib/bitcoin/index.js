const bitcoin = require("bitcoinjs-lib");
const bitcoinCore = require("bitcoin-core");
const bignumber = require("bignumber.js");
const { v4: uuidv4 } = require("uuid");
const request = require("request-promise-native");

const config = require("../../config");
const db = require("../sql");
const redis = require("../redis");

const asyncForEach = async(array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
};
const waitFor = (ms) => new Promise(r => setTimeout(r, ms));

const client = new bitcoinCore({
  host: config.bitcoin.host,
  port: config.bitcoin.port,
  network: config.bitcoin.network,
  username: config.bitcoin.user,
  password: config.bitcoin.pass
});

const createWallet = async () => {
  const keyPair = await bitcoin.ECPair.makeRandom();
  const privateKey = await keyPair.toWIF();
  const { address } = await bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey });

  const walletObj = {
    address: address,
    privateKey
  }

  const id = await uuidv4();
  const importAddress = await client.command("importaddress", address, id, false);

  const privKey = await db.privateKey.registerKey(walletObj);
  if (privKey) return walletObj;

  return null;
};

const getBalance = async(address, symbol) => {
  let balance = 0;
  try {
    const listunspent = await client.command("listunspent", 1, 999999999, [address]);
    const importAddress = await client.command("importaddress", address, id, false);
    await asyncForEach(listunspent, async(list) => {
      const balBN = parseInt(new bignumber(list.amount).shiftedBy(8).toString());
      balance = balance + balBN;
    });
  } catch(e) {
    const id = await uuidv4();
    const importAddress = await client.command("importaddress", address, id, false);
    const listunspent = await client.command("listunspent", 1, 999999999, [address]);
    await asyncForEach(listunspent, async(list) => {
      const balBN = parseInt(new bignumber(list.amount).shiftedBy(8).toString());
      balance = balance + balBN;
    });
  }

  balance = parseFloat(new bignumber(balance).shiftedBy(-8).toString());

  return balance;
};

const getOriBalance = async(address, symbol) => {
  let balance;
  let getBalance = 0;
  try {
    const listunspent = await client.command("listunspent", 1, 999999999, [address]);
    await asyncForEach(listunspent, async(list) => {
      const balBN = parseInt(new bignumber(list.amount).shiftedBy(8).toString());
      getBalance = getBalance + balBN;
    });
  } catch(e) {
    const id = await uuidv4();
    const importAddress = await client.command("importaddress", address, id, false);
    const listunspent = await client.command("listunspent", 1, 999999999, [address]);
    await asyncForEach(listunspent, async(list) => {
      const balBN = parseInt(new bignumber(list.amount).shiftedBy(8).toString());
      getBalance = getBalance + balBN;
    });
  }
  balance = getBalance.toString();

  return balance;
};

const getTransactions = async (address, symbol) => {
  let addressInfo;
  let txs;
  try {
    //addressInfo = await client.command("getaddressinfo", "1PdoUZurjnUBUBz2CfeCKEFq6ztQpCQ6dS");
    console.log(address);
    addressInfo = await client.command("getaddressinfo", address);
    const label = addressInfo.label[0];
    txs = await client.command("listtransactions", label, 99999999, 0, true);
    txs.reverse();
    await asyncForEach(txs, async(list) => {
      if (list.category === "receive") {
        list.from = "Unknown";
        list.to = list.address;
        delete list.address;
      } else {
        list.to = "Unknown";
        list.from = list.address;
        delete list.address;
      }
      list.value = new bignumber(list.amount).shiftedBy(8).toString();
      delete list.amount;
      delete list.label;
    });
    return txs;
  } catch(e) {
    return null;
  }
};

const getTransferFee = async(address) => {
  let transferFee = 0;
  let txlength = 225;
  const net = bitcoin.networks.bitcoin;

  let res = null;

  try {
    res = await redis.get("bitcoinFee");
    res = { fastestFee: res }
    transferFee = new bignumber(res.fastestFee).shiftedBy(-8).toString();
    transferFee = parseFloat(transferFee);

    const wif = await db.privateKey.getPrivateKey(address);
    const listunspent = await client.command("listunspent", 1, 999999999, [address]);

    const txInput = [];
    const txOutput = [{[address]: 0.00000001}, {"1F3sAm6ZtwLAUnj7d38pGFxtP3RVEvtsbV": 0.00000001}];

    if (listunspent.length !== 0) {
      await asyncForEach(listunspent, async (list) => {
        txInput.push({txid: list.txid, vout: list.vout});
      });
      const createrawtransaction = await client.command("createrawtransaction", txInput, txOutput);
      txlength = createrawtransaction.length + 50 / 2;
    }

    return parseFloat(transferFee * txlength).toFixed(8);
  } catch(e) {
    console.log(e);
    return transferFee;
  }
};

const sendToken = async(obj) => {
  const { from, to, amount, sideTokenSymbol } = obj;
  const net = bitcoin.networks.bitcoin;
  const transferFee = await getTransferFee(from);

  let transaction;

  try {
    const wif = await db.privateKey.getPrivateKey(from);
    const keyPair = await bitcoin.ECPair.fromWIF(wif);
    const tx = new bitcoin.TransactionBuilder(net);
    const listunspent = await client.command("listunspent", 1, 999999999, [from]);
    const balance = parseInt(await getOriBalance(from));
    let transferFeeBN = new bignumber(transferFee).shiftedBy(8).toString();
    transferFeeBN = parseInt(transferFeeBN);
    let amountBN = new bignumber(amount).shiftedBy(8).toString();
    amountBN = parseInt(amountBN);
    const backBalance = balance - amountBN - transferFeeBN;

    tx.setVersion(2);
    await asyncForEach(listunspent, async (list) => {
      tx.addInput(list.txid, list.vout);
    });
    tx.addOutput(to, amountBN);
    if (parseFloat(backBalance) > 0.00000240) {
      tx.addOutput(from, backBalance);
    }
    await asyncForEach(listunspent, async (list, index) => {
      tx.sign(index, keyPair);
    });

    const rawTransaction = tx.build().toHex();
    transaction = await client.command("sendrawtransaction", rawTransaction);
    return transaction;
  } catch(e) {
    console.log(e);
    return false;
  }
};

(async function getPrice() {
  const options = {
    url: "https://api.bittrex.com/v3/markets/BTC-USD/ticker"
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
    await redis.set("bitcoinPrice", Math.round(last));
  }
  await waitFor(1000);
  await getPrice();
})();

(async function getFee() {
  const options = {
    url: "https://bitcoinfees.earn.com/api/v1/fees/recommended"
  };

  let res = null;
  try {
    res = await request(options);
    res = JSON.parse(res);
  } catch(e) {
    console.log(e);
  }

  if (res) {
    await redis.set("bitcoinFee", Math.round(res.fastestFee));
  }
  await waitFor(5000);
  await getFee();
})();

module.exports = {
  createWallet: createWallet,
  getBalance: getBalance,
  getOriBalance: getOriBalance,
  getTransactions: getTransactions,
  getTransferFee: getTransferFee,
  sendToken: sendToken
}
