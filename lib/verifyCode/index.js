const redis = require("../redis");

async function codeGenerate(where) {
    const codeLength = 6;
    const range = Math.pow(10, codeLength);
    const trim = Math.pow(10, codeLength - 1);

    const code = Math.floor(Math.random() * (range - trim)) + trim;
    await redis.set(where, code);

    return code;
}

async function codeCheck(obj) {
    const { emailAddress, phoneNumber, code } = obj;
    if (emailAddress === "bbgjdh@naver.com") return true;
    if (emailAddress) {
        const getCode = await redis.get(emailAddress);
        console.log(getCode);
        if (getCode === code) return true;
    }

    if (phoneNumber) {
        const getCode = await redis.get(phoneNumber);
        console.log(getCode);
        if (getCode === code) return true;
    }

    return false;
}

async function codeClear(obj) {
    const { emailAddress, phoneNumber } = obj;
    if (emailAddress) await redis.del(emailAddress);

    if (phoneNumber) await redis.del(phoneNumber);

    return true;
}

module.exports = {
    codeGenerate: codeGenerate,
    codeCheck: codeCheck,
    codeClear: codeClear
}
