const express = require('express');
const router = express.Router();
const calendarController = require('../../controllers/calendarController');

// Récupérer tous les événements
router.get('/', calendarController.getAllEvents);
// Ajouter un événement
router.post('/', calendarController.addEvent);
// Supprimer un événement
router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
