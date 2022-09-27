const { v4: uuidv4 } = require("uuid");
const cfSign = require('aws-cloudfront-sign');

const verifyCode = require("../../verifyCode");
const bcrypt = require("../../bcrypt");
const jwt = require("../../jwt");
const config = require("../../../config");

const { Op } = require("sequelize");
async function asyncForEach(array, callback) { for (let index = 0; index < array.length; index++) { await callback(array[index], index, array); }}

module.exports = function(sequelize, Sequelize) {
  const Users = sequelize.define("users", {
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
    emailAddress: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    password: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    pinCode: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    name: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    phoneNumber: {
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    address: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    ethAddress: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING,
    },
    btcAddress: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING
    },
    userPic: {
      unique: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.STRING
    },
    isAdmin: {
      defaultValue: false,
      type: Sequelize.BOOLEAN
    },
    isLegacyTokenAirDrop: {
      defaultValue: false,
      type: Sequelize.BOOLEAN
    },
    lockUp: {
      defaultValue: false,
      type: Sequelize.BOOLEAN
    },
    lockUpPeriod: {
      type: Sequelize.DATE
    },
    lockUpRate: {
      type: Sequelize.INTEGER
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    /*indexes: [
        {
            unique: true,
            fields: ["emailAddress"]
        }
    ]*/
  });

  Users.findByEmailAddressOrPhoneNumber = async function (obj) {
    const { emailAddress, phoneNumber } = obj;
    const res = await this.findOne({ where: {emailAddress }});
    //return res;
    return null;
  }

  Users.findByLuniverseAddress = async function (address) {
    const user = await this.findOne({ where: { address }});
    return user;
  }

  Users.findByEmailAddress = async function (emailAddress) {
    const user = await this.findOne({ where: { emailAddress }});
    //return user;
    return null;
  }

  Users.findByPhoneNumber = async function (phoneNumber) {
    const user = await this.findOne({ where: { phoneNumber: phoneNumber }});
    //return user;
    return null;
  }

  Users.findById = async function(id) {
    const res = await this.findOne({
      where: {
        id
      },
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
    });

    return res;
  }

  Users.findByUserId = async function(userId) {
    const res = await this.findOne({
      where: {
        userId
      },
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
    });

    return res;
  }

  Users.findByUserIdAndEmailAddrss = async function(userId, emailAddress) {
    const res = await this.findOne({
      where: {
        userId,
        emailAddress
      },
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
    });

    return res;
  }

  Users.findBySearchObj = async function (obj) {
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
        {address: { [Op.like]: "%" + obj.search + "%" } },
        {ethAddress: { [Op.like]: "%" + obj.search + "%" } },
        {btcAddress: { [Op.like]: "%" + obj.search + "%" } },
        {emailAddress: { [Op.like]: "%" + obj.search + "%" } },
        {name: { [Op.like]: "%" + obj.search + "%" } },
        {userId: { [Op.like]: "%" + obj.search + "%" } },
        {phoneNumber: { [Op.like]: "%" + obj.search + "%" } }
      ]
    };


    if (obj.lockUp !== undefined) {
      whereQry.lockUp = obj.lockUp === "true";
    }

    const users = await this.findAll({
      where: whereQry,
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "userPic", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
      limit: Number(obj.size),
      offset: (page - 1) * 20,
      order
    });

    asyncForEach(users, async (v) => {
      const signParams = config.cfConfig;
      signParams.expireTime = new Date().getTime() + config.cfConfig.imageTimeOut;
      v.userPic = await cfSign.getSignedUrl(config.aws.imgUrl + "userPic/" + v.userPic, signParams);
    });

    const total = await this.count();

    return {users, total};
  }

  Users.getAddress = async function(id) {
    const res = await this.findOne({
      where: {
        id
      },
      attributes: ["userId", "emailAddress", "address", "lockUp", "lockUpPeriod", "lockUpRate"],
    });
    return res;
  }

  Users.getEthAddress = async function(id) {
    const res = await this.findOne({
      where: {
        id
      },
      attributes: ["userId", "emailAddress", "ethAddress", "lockUp", "lockUpPeriod", "lockUpRate"],
    });
    return res;
  }

  Users.getBtcAddress = async function(id) {
    const res = await this.findOne({
      where: {
        id
      },
      attributes: ["userId", "emailAddress", "btcAddress", "lockUp", "lockUpPeriod", "lockUpRate"],
    });
    return res;
  }

  Users.checkAddress = async function(type, address) {
    const whereQry = {};

    switch (type) {
      case "luniverse":
        whereQry.address = address;
        break;
      case "ethereum":
        whereQry.ethAddress = address
        break;
      case "bitcoin":
        whereQry.btcAddress = address;
        break;
      default:
        whereQry.address = address;
        break;
    }
    const res = await this.findOne({
      where: whereQry
    });

    return res;
  }

  Users.registerUser = async function (obj) {
    const { userId, emailAddress, phoneNumber, emailCode, mobileCode, password, pinCode, name, address, ethAddress, btcAddress, userPic } = obj;

    const emailCheckObj = {
      code: emailCode,
      emailAddress
    }
    const phoneCHeckObj = {
      code: mobileCode,
      phoneNumber
    }
    const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);
    //const mobileCodeCheck = await verifyCode.codeCheck(phoneCHeckObj);

    //if (!emailCodeCheck || !mobileCodeCheck) {
    if (!emailCodeCheck) {
      return null;
    }

    const id = await uuidv4();
    const passwordHash = await bcrypt.createPasswordHash(password);
    const pinCodeHash = await bcrypt.createPasswordHash(pinCode);

    let lockUp = false;
    //if (phoneNumber.indexOf("81") !== -1) lockUp = false;

    const user = await this.create({
      id,
      userId: userId.trim(),
      address,
      ethAddress,
      btcAddress,
      userPic,
      emailAddress: emailAddress.trim(),
      phoneNumber: phoneNumber,
      password: passwordHash,
      pinCode: pinCodeHash,
      name,
      lockUp
    });

    await verifyCode.codeClear({ emailAddress, phoneNumber });

    return user;
  }

  Users.login = async function(obj) {
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

  Users.otherLogin = async function(obj) {
    const { userId, password } = obj;
    const user = await this.findOne({
      where: {
        emailAddress: userId
      }
    });

    if (!user) return false;

    const passwordHash = user.password;
    const checked = await bcrypt.checkPasswordHash(password, passwordHash);

    if (!checked) return false;

    if (user) return user;

    return false;
  }

  Users.pinCodeCheck = async function(obj) {
    const { emailAddress, userId, pinCode } = obj;
    const user = await this.findOne({
      where: {
        emailAddress,
        userId
      }
    });

    if (!user) return false;

    const pinCodeHash = user.pinCode;
    const checked = await bcrypt.checkPasswordHash(pinCode, pinCodeHash);

    if (!checked) return false;

    return true;
  }

  Users.getAllUsers = async function() {
    const users = await this.findAll({
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
    });

    return users;
  }

  Users.setLockUp = async function(obj) {
    const { emailAddress, lockUp, lockUpPeriod, lockUpRate } = obj;
    let user = await this.findOne({
      where: {
        emailAddress
      },
      attributes: ["id", "userId", "address", "btcAddress", "ethAddress", "emailAddress", "name", "phoneNumber", "isAdmin", "isLegacyTokenAirDrop", "lockUp", "lockUpPeriod", "lockUpRate", "createdAt"],
    });

    user.lockUp = lockUp;
    user.lockUpRate = lockUpRate;
    if (lockUpPeriod !== "") user.lockUpPeriod = new Date(lockUpPeriod);
    else user.lockUpPeriod = null;

    user = await user.save();
    return user;
  }

  Users.changePassword = async function(obj) {
    const { userId, emailAddress, newPassword, code } = obj;
    const emailCheckObj = {
      code,
      emailAddress
    }

    const emailCodeCheck = await verifyCode.codeCheck(emailCheckObj);
    if (!emailCodeCheck) {
      return null;
    }

    let user = await this.findOne({
      where: { emailAddress, userId }
    });

    if (!user) return null;

    const passwordHash = await bcrypt.createPasswordHash(newPassword);
    user.password = passwordHash;

    user = await user.save();
    await verifyCode.codeClear({ emailAddress });
    return user;
  }

  return Users;
}
