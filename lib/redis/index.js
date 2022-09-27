const redis = require("redis");
const config = require("../../config");

const {promisify} = require('util');
const client = redis.createClient(config.redis);

module.exports = {
    get: promisify(client.get).bind(client),
    set: promisify(client.set).bind(client),
    del: promisify(client.del).bind(client)
};