const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  // 1. Cấu hình Server gửi mail (Dùng Mailtrap để test hoặc Gmail thật)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER || "2c7e8879dea1d1",
      pass: process.env.EMAIL_PASS || "dcbc11a9eb039c",
    },
  });

  // 2. Nội dung Email
  const mailOptions = {
    from: '"Fashion Shop Support" <noreply@fashionshop.com>',
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  // 3. Thực thi gửi
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;