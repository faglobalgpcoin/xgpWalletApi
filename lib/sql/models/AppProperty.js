const { v4: uuidv4 } = require("uuid");

module.exports = function(sequelize, Sequelize) {
    const AppProperty = sequelize.define("appProperty", {
        id: {
            primaryKey: true,
            allowNull: false,
            notEmpty: true,
            type: Sequelize.UUID
        },
        keyName: {
            notEmpty: true,
            allowNull: false,
            type: Sequelize.STRING
        },
        value: {
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
                fields: ["keyName"]
            }
        ]
    });

    AppProperty.getProperties = async function() {
        const properties = await this.findAll({
            raw: true,
            attributes: ["id", "keyName", "value"],
            order: [
                ['keyName', 'ASC'],
            ],
        });
        return properties;
    }

    AppProperty.findByKey = async function(keyName) {
        const property = await this.findOne({
            where: {
                keyName
            },
            raw: true,
            attributes: ["value"],
        });
        return property;
    }

    AppProperty.registerAppProperty = async function(obj) {
        const { keyName, value } = obj;
        const id = await uuidv4();

        const property = await this.create({
            id,
            keyName,
            value
        });

        return property;
    }

    AppProperty.updateAppProperty = async function(obj) {
        const { keyName, value } = obj;

        const property = await this.update({
            keyName,
            value
        }, {
            where: {
                keyName
            },
        });

        if (property[0] === 1) return obj;
        else return null;
    }

    return AppProperty;
}
