require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3004,
  db: {
    host: process.env.DB_HOST || '192.168.129.50',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Jpvw1953!',
    database: process.env.DB_NAME || 'calendar_db',
  }
};
