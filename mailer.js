const nodemailer = require("nodemailer");
const { config } = require("./config.js");

const sendMail = async (subject, text) => {
  const transporter = nodemailer.createTransport(config.email.smtp);

  const mailOptions = {
    from: config.email.from,
    to: config.email.to.join(", "),
    subject,
    text
  };

  await transporter.sendMail(mailOptions);
  console.log("📧 Email sent successfully");
};

module.exports = { sendMail };
