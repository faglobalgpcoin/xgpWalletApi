const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');

const config = require("../../config");

const sequelize = new Sequelize(process.env.SQL_DB, process.env.SQL_USER, process.env.SQL_PASS, config.sql);
const db ={};

fs.readdirSync(__dirname + "/models/").filter(function (file) {
    return (file.indexOf(".") !== 0) && (file !== "index.js");
}).forEach(function (file) {
    const model = sequelize['import'](path.join(__dirname + "/models/", file));
    db[model.name] = model;
});

Object.keys(db).forEach(function (modelName) {
    if ("associate" in db[modelName]) {
        db[modelName].associate(db);
    }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

sequelize.sync({force: false}).then(() => {
    console.log("MariaDB Connected!!");
}).catch(e => {
    console.log(e);
    console.log("MariaDB Connect Failed");
});

module.exports = db;