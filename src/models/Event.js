
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
  async create({ title, date, type }) {
    await pool.query('INSERT INTO events (title, date, type) VALUES (?, ?, ?)', [title, date, type]);
  },
  async update(id, { title, date, type }) {
    const [result] = await pool.query('UPDATE events SET title = ?, date = ?, type = ? WHERE id = ?', [title, date, type, id]);
    return result.affectedRows > 0;
  },
  async delete(id) {
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  },
};

module.exports = Event;
