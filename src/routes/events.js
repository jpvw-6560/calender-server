const express = require('express');
const router = express.Router();
const calendarController = require('../../controllers/calendarController');


// Récupérer tous les événements
router.get('/', calendarController.getAllEvents);
// Récupérer un événement par id
router.get('/:id', calendarController.getEventById);
// Ajouter un événement
router.post('/', calendarController.addEvent);
// Modifier un événement
router.put('/:id', calendarController.updateEvent);
// Supprimer un événement
router.delete('/:id', calendarController.deleteEvent);

module.exports = router;
