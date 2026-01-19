const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = process.env.PORT || 3004;

// Suppression du moteur de vues, API REST uniquement

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', calendarRoutes);

app.listen(PORT, () => {
  console.log(`Serveur calendrier lancé sur le port ${PORT}`);
});
