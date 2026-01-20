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
    // Table des événements (structure enrichie)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        type VARCHAR(50) NOT NULL,
        icon VARCHAR(8),
        showIcon BOOLEAN DEFAULT false,
        showTitle BOOLEAN DEFAULT true,
        sendTelegram BOOLEAN DEFAULT false,
        telegramTime TIME,
        recurrence VARCHAR(20)
      )
    `);
    // Ajout des colonnes manquantes si la table existe déjà
    const [cols] = await connection.query("SHOW COLUMNS FROM events");
    const colNames = cols.map(c => c.Field);
    const alter = [];
    if (!colNames.includes('icon')) alter.push('ADD COLUMN icon VARCHAR(8)');
    if (!colNames.includes('showIcon')) alter.push('ADD COLUMN showIcon BOOLEAN DEFAULT false');
    if (!colNames.includes('showTitle')) alter.push('ADD COLUMN showTitle BOOLEAN DEFAULT true');
    if (!colNames.includes('sendTelegram')) alter.push('ADD COLUMN sendTelegram BOOLEAN DEFAULT false');
    if (!colNames.includes('telegramTime')) alter.push('ADD COLUMN telegramTime TIME');
    if (!colNames.includes('recurrence')) alter.push('ADD COLUMN recurrence VARCHAR(20)');
    if (alter.length) await connection.query(`ALTER TABLE events ${alter.join(', ')}`);
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
