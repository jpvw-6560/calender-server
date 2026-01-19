
const { pool } = require('../../config/database');


const Event = {
  async getAll() {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY date');
    return rows;
  },
  async create({ title, date, type }) {
    await pool.query('INSERT INTO events (title, date, type) VALUES (?, ?, ?)', [title, date, type]);
  },
  async delete(id) {
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  },
};

module.exports = Event;
