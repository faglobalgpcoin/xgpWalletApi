const bcrypt = require("bcrypt");
const config = require("../../config");

async function createPasswordHash(password) {
    const hash = await bcrypt.hash(password, Number(config.bcrypt.saltRounds));
    return hash;
}

async function checkPasswordHash(password, passwordHash) {
    const checked = await bcrypt.compare(password, passwordHash);
    return checked;
}

module.exports = {
    createPasswordHash: createPasswordHash,
    checkPasswordHash: checkPasswordHash
}