const mailer = require('../config/mailerConfig');

exports.sendSoporteEmail = async ({ nombre, empresa, telefono, descripcion }) => {
  return mailer.sendMail({
    from: '"Soporte Web" <administrador@bot-whatsapp.es>',
    to: 'samueldenizgalvan@gmail.com',
    subject: 'Nuevo mensaje de Soporte',
    text: `Nombre: ${nombre}\nEmpresa: ${empresa}\nTeléfono: ${telefono}\nMensaje:\n${descripcion}`
  });
};

exports.sendBotRequestEmail = async ({ empresaBot, contactoBot, infoCliente, observacionesBot }) => {
  return mailer.sendMail({
    from: '"Solicitud Bot" <administrador@bot-whatsapp.es>',
    to: 'samueldenizgalvan@gmail.com',
    subject: 'Nueva solicitud desde Bot Request',
    text: `Empresa: ${empresaBot}\nContacto: ${contactoBot}\nInformación cliente:\n${infoCliente}\nObservaciones:\n${observacionesBot}`
  });
};
