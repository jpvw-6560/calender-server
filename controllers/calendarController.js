const Event = require('../src/models/Event');

// Récupérer tous les événements (GET /api/events)
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.getAll();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des événements.' });
  }
};

// Ajouter un événement (POST /api/events)
exports.addEvent = async (req, res) => {
  try {
    const { title, date, type } = req.body;
    await Event.create({ title, date, type });
    res.status(201).json({ message: 'Événement ajouté.' });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'ajout de l'événement." });
  }
};

// Supprimer un événement (DELETE /api/events/:id)
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    await Event.delete(id);
    res.json({ message: 'Événement supprimé.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression.' });
  }
};
