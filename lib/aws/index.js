const AWS = require("aws-sdk");
const config = require("../../config");

async function sendSMS(obj) {
  AWS.config = new AWS.Config(config.aws);

  const sns = new AWS.SNS();
  const res = await sns.publish(obj).promise();
  return res;
}

module.exports = {
  sendSMS: sendSMS
}
