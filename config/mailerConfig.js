const nodemailer = require('nodemailer');
const mailer = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true, // true para 465 (SSL)
  auth: {
    user: 'administrador@bot-whatsapp.es',
    pass: '9vtk6L6q7vTRw$='
  },
  logger: true,
  debug: true
});

module.exports = mailer;
