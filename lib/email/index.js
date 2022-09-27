const Email = require('email-templates');
const config = require("../../config");

async function sendMail(mail) {
    const email = new Email(config.mail);
    return email.send({
        template: mail.template,
        message: {
            to: mail.to
        },
        locals: mail.locals
    });
}

module.exports = {
    sendMail: sendMail
}