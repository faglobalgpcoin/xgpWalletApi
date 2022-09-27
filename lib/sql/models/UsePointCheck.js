const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

module.exports = function(sequelize, Sequelize) {
  const UsePointCheck = sequelize.define("usePointCheck", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    userId: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.TEXT
    },
    useToken: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.FLOAT
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  UsePointCheck.findByUserId = async function(userId) {
    const d = new Date();
    const year = d.getFullYear(); // 년
    const month = d.getMonth();   // 월
    const day = d.getDate();      // 일
    const td = new Date(year, month, day, -9);

    const res = await this.findOne({
      where: {
        userId,
        updatedAt: {
          [Op.gte]: td
        }
      }
    });

    return res;
  }

  UsePointCheck.upsert = async function(obj) {
    const { userId, amount } = obj;

    const d = new Date();
    const year = d.getFullYear(); // 년
    const month = d.getMonth();   // 월
    const day = d.getDate();      // 일
    const td = new Date(year, month, day, -9);

    let res = await this.findOne({
      where: {
        userId,
      }
    });

    if (res) {
      if (res.updatedAt.getTime() < td.getTime()) {
        res.useToken = parseFloat(0) + parseFloat(amount);
        res.updatedAt = new Date();

        res.changed('updatedAt', true);
        await res.save({
          slient: false,
          fields: ['updatedAt']
        });
      } else {
        res.useToken = parseFloat(res.useToken) + parseFloat(amount);
        res.updatedAt = new Date();
        res.changed('updatedAt', true);
        await res.save({
          slient: false,
          fields: ['updatedAt']
        });
      }
    } else {
      const id = await uuidv4();
      res = await this.create({
        id,
        userId,
        useToken: parseFloat(amount)
      });
    }

    return res;
  }

  return UsePointCheck;
}
