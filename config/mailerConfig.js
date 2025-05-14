const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
  host: 'localhost',
  port: 25,
  secure: false,
  tls: { rejectUnauthorized: false },
  logger: true,
  debug: true
});

module.exports = mailer;
