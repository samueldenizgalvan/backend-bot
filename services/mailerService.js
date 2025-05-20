const mailer = require('../config/mailerConfig');

exports.sendBotRequestEmail = async ({ empresaBot, contactoBot, infoCliente, observacionesBot }) => {
  return mailer.sendMail({
    from: '"Solicitud Bot" <administrador@bot-whatsapp.es>',
    to: 'samueldenizgalvan@gmail.com',
    subject: 'Nueva solicitud desde Bot Request',
    text: `Empresa: ${empresaBot}\nContacto: ${contactoBot}\nInformación cliente:\n${infoCliente}\nObservaciones:\n${observacionesBot}`
  });
};
