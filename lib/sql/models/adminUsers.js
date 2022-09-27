const { v4: uuidv4 } = require("uuid");
const verifyCode = require("../../verifyCode");
const bcrypt = require("../../bcrypt");
const jwt = require("../../jwt");

const { Op } = require("sequelize");

module.exports = function(sequelize, Sequelize) {
  const AdminUsers = sequelize.define("adminUsers", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    userId: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    password: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    name: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    level: {
      type: Sequelize.INTEGER,
      allowNull: false,
      notEmpty: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      notEmpty: true,
    },
    permissions: {
      type: Sequelize.STRING,
      allowNull: false,
      notEmpty: true,
      get: function() {
        return JSON.parse(this.getDataValue("permissions"));
      },
      set: function(value) {
        return this.setDataValue("permissions", JSON.stringify(value));
      }
    }
  });

  AdminUsers.findById = async function(id) {
    const res = await this.findOne({
      where: {
        id
      },
      attributes: ["id", "userId", "level", "name", "permissions", "userId", "active"],
    });

    return res;
  }

  AdminUsers.getAllUsers = async function() {
    const res = await this.findAll({
      attributes: ["id", "userId", "level", "name", "permissions", "userId", "active"],
    });

    return res;
  }

  AdminUsers.login = async function(obj) {
    const { userId, password } = obj;
    const user = await this.findOne({
      where: {
        userId
      }
    });

    if (!user) return false;

    const passwordHash = user.password;
    const checked = await bcrypt.checkPasswordHash(password, passwordHash);

    if (!checked) return false;

    const jwtPayload = { sub: user.id };
    const token = await jwt.createAccessToken(jwtPayload);

    if (token) return token;

    return false;
  }

  AdminUsers.registerUser = async function (obj) {
    const { userId, password, active, permissions, name, level } = obj;

    const id = await uuidv4();
    const passwordHash = await bcrypt.createPasswordHash(password);

    const user = await this.create({
      id,
      userId,
      active,
      name,
      permissions,
      level,
      password: passwordHash
    });

    return user;
  }

  AdminUsers.deleteUser = async function (id) {
    const user = await this.findOne({
      where: {
        id
      }
    });

    if (!user) return false;

    await user.destroy();
    return true;
  }

  return AdminUsers;
}
