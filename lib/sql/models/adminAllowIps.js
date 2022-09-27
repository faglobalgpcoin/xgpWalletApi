const { v4: uuidv4 } = require("uuid");
const verifyCode = require("../../verifyCode");
const bcrypt = require("../../bcrypt");
const jwt = require("../../jwt");

const { Op } = require("sequelize");

module.exports = function(sequelize, Sequelize) {
  const AdminAllowIps = sequelize.define("adminAllowIps", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    ip: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
  });

  AdminAllowIps.getAllowIps = async function() {
    const res = await this.findAll({
      attributes: ["id", "ip"],
    });

    return res;
  }

  AdminAllowIps.deleteIp = async function (id) {
    const ip = await this.findOne({
      where: {
        id
      }
    });

    if (!ip) return false;

    await ip.destroy();
    return true;
  }

  AdminAllowIps.registerIp = async function(obj) {
    const { ip } = obj;
    const id = await uuidv4();

    const addIp = await this.create({
      id,
      ip
    });

    return addIp;
  }

  AdminAllowIps.findByIp = async function(ip) {
    console.log(ip);
    const res = await this.findOne({
      where: {
        ip
      },
      attributes: ["id", "ip"],
    });

    return res;
  }

  return AdminAllowIps;
}
