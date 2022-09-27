const Core = require('@alicloud/pop-core');
const config = require("../../config");

const client = new Core({
  accessKeyId: config.alibaba.accessKeyId,
  accessKeySecret: config.alibaba.accessKeySecret,
  endpoint: 'https://dysmsapi.ap-southeast-1.aliyuncs.com',
  apiVersion: '2018-05-01'
});

async function sendSMS(obj) {
  const params = {
    RegionId: "ap-southeast-1",
    To: obj.to,
    Message: obj.body
  }
  const res = await client.request('SendMessageToGlobe', params, {method: 'POST'});
  console.log(res);
  return res;
}

async function sendChinaSMS(obj) {
  const templateParam = {
    code: obj.body,
  }

  const params = {
    RegionId: "ap-southeast-1",
    TemplateCode: config.alibaba.templateCode,
    From: "XGP",
    TemplateParam: JSON.stringify(templateParam),
    To: obj.to,
  }

  console.log(params);

  const res = await client.request('SendMessageWithTemplate', params, {method: 'POST'});
  console.log(res);
  return res;
}

module.exports = {
  sendSMS,
  sendChinaSMS
}
