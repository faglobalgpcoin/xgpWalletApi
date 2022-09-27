const jwt = require("jsonwebtoken");
const config = require("../../config");

async function jwtMiddleware(req, res, next) {
    let token = null;
    req.user = null;

    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') token = req.headers.authorization.split(' ')[1];
    if (!token) return next();

    try {
        const decodeJwt = await decodeAccessToken(token);
        req.user = decodeJwt;
    } catch(e) {
        const returnObj = {
            status: "fail",
            message: "Unauthorized Access",
            data: null,
            timeStamp: parseInt(new Date().getTime() / 1000)
        };
        res.status(401);
        return res.json(returnObj);
    }

    return next();
}

async function createAccessToken(payload) {
    const token = await jwt.sign(payload, config.jwt.secret, { expiresIn: "1d" });
    return token;
}

async function decodeAccessToken(token) {
    const decode = await jwt.verify(token, config.jwt.secret);
    const info = {
        id: decode.sub
    }
    return info;
}

module.exports = {
    jwtMiddleware: jwtMiddleware,
    createAccessToken: createAccessToken,
    decodeAccessToken: decodeAccessToken
}