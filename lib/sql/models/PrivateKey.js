const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const config = require("../../../config");

module.exports = function(sequelize, Sequelize) {
  const PrivateKey = sequelize.define("privateKey", {
    id: {
      primaryKey: true,
      allowNull: false,
      notEmpty: true,
      type: Sequelize.UUID
    },
    address: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.STRING
    },
    encString: {
      notEmpty: true,
      allowNull: false,
      type: Sequelize.TEXT
    }
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    indexes: [
      {
        unique: true,
        fields: ["address"]
      }
    ]
  });

  PrivateKey.registerKey = async function(obj) {
    const { address, privateKey } = obj;
    const encKey = config.luniverse.walletEncKey;
    const id = await uuidv4();
    const iv = Buffer.from(config.wallet.iv.slice(0,16));

    const cipher = crypto.createCipheriv("aes-256-cbc", encKey, iv);
    let encString = cipher.update(privateKey, "utf8", "base64");
    encString += cipher.final('base64');

    const res = await this.create({
      id,
      address,
      encString
    })
    return res;
  }

  PrivateKey.getPrivateKey = async function(address) {
    const encKey = config.luniverse.walletEncKey;
    const iv = Buffer.from(config.wallet.iv.slice(0,16));
    const result = await this.findOne({
      where: {
        address
      },
      raw: true,
      attributes: ["encString"],
    });

    const decipher = crypto.createDecipheriv("aes-256-cbc", encKey, iv);
    let privateKey = decipher.update(result.encString, "base64", "utf8");
    privateKey += decipher.final("utf8");

    return privateKey;
  }

  return PrivateKey;
}
