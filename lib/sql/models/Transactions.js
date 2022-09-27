const { v4: uuidv4 } = require("uuid");

const { Op } = require("sequelize");

module.exports = function(sequelize, Sequelize) {
  const Transactions = sequelize.define("transactions", {
    num: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    id: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    symbol: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    txid: {
      unique: true,
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    txHash: {
      type: Sequelize.STRING,
    },
    blockHash: {
      type: Sequelize.STRING,
    },
    from: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    fromUserId: {
      type: Sequelize.STRING
    },
    to: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    toUserId: {
      type: Sequelize.STRING
    },
    volume: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    whereSend: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.BOOLEAN
    },
    converted: {
      type: Sequelize.BOOLEAN
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  Transactions.registerTx = async function(props) {
    const { txid, from, to, volume, symbol, whereSend } = props;

    const id = await uuidv4();

    const transaction = await this.create({
      id,
      txid,
      from,
      fromUserId: "",
      to,
      toUserId: "",
      volume,
      symbol,
      whereSend,
      status: false,
      converted: false
    });

    return transaction;
  }

  Transactions.findBySearchObj = async function (obj) {
    let order = [["createdAt", "desc"]];
    let page = obj.page;
    if (obj.order) {
      order = [[obj.order, obj.direction]];
    }
    if (Number(page) === 0) {
      page = 1;
    }

    const whereQry = {
      [Op.or]: [
        {txHash: { [Op.like]: "%" + obj.search + "%" } },
        {from: { [Op.like]: "%" + obj.search + "%" } },
        {fromUserId: { [Op.like]: "%" + obj.search + "%" } },
        {to: { [Op.like]: "%" + obj.search + "%" } },
        {toUserId: { [Op.like]: "%" + obj.search + "%" } },
        {symbol: { [Op.like]: "%" + obj.search + "%" } },
      ]
    };

    if (obj.startDate !== "false" || obj.endDate !== "false") {
      Object.assign(whereQry, {[Op.and]: [{createdAt: { [Op.between]: [Date.parse(obj.startDate), Date.parse(obj.endDate)]}}]});
    }

    const {count, rows: transactions } = await this.findAndCountAll({
      where: whereQry,
      attributes: ["id", "txHash", "txid", "from", "fromUserId", "to", "toUserId", "volume", "symbol", "status", "whereSend", "createdAt"],
      limit: Number(obj.size),
      offset: (page - 1) * 20,
      order
    });

    return {transactions, total: count};
  }

  Transactions.getAllTransactions = async function() {
    const transactions = await this.findAll({
      attributes: ["id", "txHash", "txid", "from", "fromUserId", "to", "toUserId", "volume", "symbol", "status", "whereSend", "createdAt"],
      limit: 10000,
      order: [['createdAt', 'desc']]
    });

    return transactions;
  }

  Transactions.getOldTransactions = async function() {
    const transactions = await this.findAll({
      where: {
        from: "0xab47d791724ca44706c59499dff0305166dcf93d",
        createdAt: {
          [Op.lt]: "2021-02-09 02:00:00"
        }
      }
    })
    return transactions;
  }

  Transactions.getNotConvertedTransactions = async function() {
    const transactions = await this.findAll({
      where: {
        converted: false,
        symbol: "XGP"
      }
    });

    return transactions;
  }

  return Transactions;
}
