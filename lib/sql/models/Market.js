const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

module.exports = function(sequelize, Sequelize) {
  const Market = sequelize.define("market", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    userId: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    phoneNumber: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    txId: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING,
      unique: true
    },
    volume: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING,
    },
    convertVolume: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  Market.findBySearchObj = async function (obj) {
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
        {txId: { [Op.like]: "%" + obj.search + "%" } },
        {userId: { [Op.like]: "%" + obj.search + "%" } },
      ]
    };

    const purchases = await this.findAll({
      where: whereQry,
      attributes: ["id", "txId", "userId", "phoneNumber", "volume", "convertVolume", "createdAt"],
      limit: Number(obj.size),
      offset: (page - 1) * 20,
      order
    });

    const total = await this.count();

    return {purchases, total};
  }

  Market.getAllPurchase = async function() {
    const purchases = await this.findAll({
      attributes: ["id", "txId", "userId", "phoneNumber", "volume", "convertVolume", "createdAt"],
    });

    return purchases;
  }

  Market.checkPurchaseRestrictions = async function(phoneNumber, first, last, rate) {
    let history = await this.findOne({
      where: {
        phoneNumber,
        createdAt: {
          [Op.gte]: first,
          [Op.lte]: last
        }
      },
      attributes: [[sequelize.fn('sum', sequelize.col('volume')), 'buyTotal']],
      raw: true
    });

    return history.buyTotal <= parseInt(rate);
  }

  Market.registerPurchase = async function(userId, phoneNumber, txId, price, convertVolume) {
    const id = await uuidv4();

    const create = this.create({
      id,
      userId,
      phoneNumber,
      txId,
      volume: price,
      convertVolume
    });

    return create;
  }

  return Market;
}
