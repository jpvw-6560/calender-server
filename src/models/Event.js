
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
  async create({ title, date, dateEnd, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence, myHolidayWeek, eventTime }) {
    const iconVal        = (typeof icon === 'string' && icon.length > 0) ? icon : null;
    const showIconVal    = showIcon === true || showIcon === 'true' || showIcon === 1 ? 1 : 0;
    const showTitleVal   = showTitle === true || showTitle === 'true' || showTitle === 1 ? 1 : 0;
    const sendTelegramVal= sendTelegram === true || sendTelegram === 'true' || sendTelegram === 1 ? 1 : 0;
    const telegramTimeVal= (typeof telegramTime === 'string' && telegramTime.length > 0) ? telegramTime : null;
    const recurrenceVal  = (typeof recurrence === 'string' && recurrence.length > 0) ? recurrence : null;
    const dateEndVal     = (typeof dateEnd === 'string' && dateEnd.length > 0) ? dateEnd : null;
    const myHolidayWeekVal = (myHolidayWeek === 1 || myHolidayWeek === 2) ? myHolidayWeek : null;
    const eventTimeVal   = (typeof eventTime === 'string' && eventTime.length > 0) ? eventTime : null;
    const sql = 'INSERT INTO events (title, date, dateEnd, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence, myHolidayWeek, eventTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    await pool.query(sql, [title, date, dateEndVal, type, iconVal, showIconVal, showTitleVal, sendTelegramVal, telegramTimeVal, recurrenceVal, myHolidayWeekVal, eventTimeVal]);
  },
  async update(id, { title, date, dateEnd, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence, myHolidayWeek, eventTime }) {
    const myHolidayWeekVal = (myHolidayWeek === 1 || myHolidayWeek === 2) ? myHolidayWeek : null;
    const eventTimeVal = (typeof eventTime === 'string' && eventTime.length > 0) ? eventTime : null;
    const [result] = await pool.query(
      'UPDATE events SET title = ?, date = ?, dateEnd = ?, type = ?, icon = ?, showIcon = ?, showTitle = ?, sendTelegram = ?, telegramTime = ?, recurrence = ?, myHolidayWeek = ?, eventTime = ? WHERE id = ?',
      [title, date, dateEnd || null, type, icon || null, !!showIcon, !!showTitle, !!sendTelegram, telegramTime || null, recurrence || null, myHolidayWeekVal, eventTimeVal, id]
    );
    return result.affectedRows > 0;
  },
  async delete(id) {
    await pool.query('DELETE FROM events WHERE id = ?', [id]);
  },
};

module.exports = Event;
