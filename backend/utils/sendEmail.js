const nodemailer = require('nodemailer');

/**
 * Reusable utility function to send emails
 * @param {Object} options - Email options
 * @param {string} options.email - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.message - Email HTML or Text body
 */
const sendEmail = async (options) => {
  try {
    // 1. Create a transporter using Gmail SMTP
    // You must set EMAIL_USER and EMAIL_PASS in your .env file
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 2. Define the email options
    const mailOptions = {
      from: `Farm2Home Agritech <${process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.message, // using html to send formatted emails
    };

    // 3. Actually send the email
    await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${options.email}`);
  } catch (error) {
    console.error('Email could not be sent:', error.message);
    // We don't throw the error so that the main approval flow doesn't crash if email fails
  }
};

module.exports = sendEmail;
