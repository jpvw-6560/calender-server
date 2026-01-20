
const { pool } = require('../../config/database');


const Event = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY date');
    return rows;
  },
  async getById(id) {
    const [rows] = await pool.query('SELECT * FROM events WHERE id = ?', [id]);
    return rows[0] || null;
  },
  async create({ title, date, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence }) {
    // Conversion explicite pour MySQL
    const iconVal = (typeof icon === 'string' && icon.length > 0) ? icon : null;
    const showIconVal = showIcon === true || showIcon === 'true' || showIcon === 1 ? 1 : 0;
    const showTitleVal = showTitle === true || showTitle === 'true' || showTitle === 1 ? 1 : 0;
    const sendTelegramVal = sendTelegram === true || sendTelegram === 'true' || sendTelegram === 1 ? 1 : 0;
    const telegramTimeVal = (typeof telegramTime === 'string' && telegramTime.length > 0) ? telegramTime : null;
    const recurrenceVal = (typeof recurrence === 'string' && recurrence.length > 0) ? recurrence : null;
    const sql = 'INSERT INTO events (title, date, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    console.log('SQL:', sql, [title, date, type, iconVal, showIconVal, showTitleVal, sendTelegramVal, telegramTimeVal, recurrenceVal]);
    await pool.query(sql, [title, date, type, iconVal, showIconVal, showTitleVal, sendTelegramVal, telegramTimeVal, recurrenceVal]);
  },
  async update(id, { title, date, type, icon, showIcon, showTitle, sendTelegram, telegramTime }) {
    const [result] = await pool.query(
      'UPDATE events SET title = ?, date = ?, type = ?, icon = ?, showIcon = ?, showTitle = ?, sendTelegram = ?, telegramTime = ? WHERE id = ?',
      [title, date, type, icon || null, !!showIcon, !!showTitle, !!sendTelegram, telegramTime || null, id]
    );
    return result.affectedRows > 0;
  },
  async delete(id) {
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  },
};

module.exports = Event;
