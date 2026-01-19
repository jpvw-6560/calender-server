const Event = require('../models/Event');

// API REST : retourne tous les événements en JSON
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.getAll();
    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des événements' });
  }
};

// Ajoute un événement (API REST)
exports.addEvent = async (req, res) => {
  try {
    const { title, date, type } = req.body;
    const result = await Event.create({ title, date, type });
    res.status(201).json({ message: 'Événement ajouté', event: result });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout de l\'événement' });
  }
};

// Supprime un événement (API REST)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.body;
    await Event.delete(id);
    res.json({ message: 'Événement supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'événement' });
  }
};
