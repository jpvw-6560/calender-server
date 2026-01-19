const mysql = require('mysql2/promise');
require('dotenv').config();
const config = require('./config');

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  // Connexion sans database pour la création
  const initPool = mysql.createPool({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 1
  });
  const connection = await initPool.getConnection();
  try {
    const dbName = config.db.database;
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    // Table des événements
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(50) NOT NULL
      )
    `);
    console.log('✅ Base de données initialisée avec succès');
  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
    throw error;
  } finally {
    connection.release();
    await initPool.end();
  }
}

module.exports = { pool, initDatabase };
