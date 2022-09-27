const config = require("../../config");
const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);

async function sendSMS(obj) {
  const res = client.messages.create(obj);
  return res;
}

module.exports = {
  sendSMS: sendSMS
}
