const express = require('express');
const router = express.Router();
const { pool } = require('../../config/database');

// GET toutes les entrées (triées par date desc)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM AlternanceHistory ORDER BY startDate DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST nouvelle entrée de référence
router.post('/', async (req, res) => {
  try {
    const { startDate, alternanceType, comment } = req.body;
    if (!startDate || !alternanceType) {
      return res.status(400).json({ error: 'startDate et alternanceType sont requis' });
    }
    const [result] = await pool.query(
      'INSERT INTO AlternanceHistory (startDate, alternanceType, comment) VALUES (?, ?, ?)',
      [startDate, alternanceType, comment || null]
    );
    res.json({ id: result.insertId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE entrée
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM AlternanceHistory WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
