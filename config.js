require('dotenv').config();


const config = {
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  },
  email: {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_TO?.split(",") || [],
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  },
  cronSchedule: process.env.CRON_SCHEDULE || "0 * * * *", // default: hourly
  port: parseInt(process.env.PORT, 10) || 3000
};

module.exports = { config };