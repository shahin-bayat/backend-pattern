const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //? 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // service: 'Gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
    // Acivate in Gmail: "less secure app" option
  });

  //? 2) Define email options
  const mailOptions = {
    from: 'Shahin Bayat <me@shahinbayat.ir>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };
  //? 3) Send email
  // return a promise
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
