require('dotenv').config();

module.exports = {
  port: process.env.PORT,
  host: process.env.HOST || '127.0.0.1',
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  }
};
