// Récupérer un événement par id (GET /api/events/:id)
exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.getById(id);
    if (!event) return res.status(404).json({ error: 'Événement non trouvé.' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'événement.' });
  }
};

// Modifier un événement (PUT /api/events/:id)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, type } = req.body;
    const updated = await Event.update(id, { title, date, type });
    if (!updated) return res.status(404).json({ error: 'Événement non trouvé.' });
    res.json({ message: 'Événement modifié.' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la modification de l\'événement.' });
  }
};
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
    let { title, date, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence } = req.body;
    if (type === 'birthday') recurrence = 'yearly';
    await Event.create({ title, date, type, icon, showIcon, showTitle, sendTelegram, telegramTime, recurrence });
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
