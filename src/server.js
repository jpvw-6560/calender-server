// Handler global pour éviter l’arrêt du serveur sur erreur non capturée
process.on('uncaughtException', (err) => {
  console.error('Erreur non capturée :', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesse non gérée :', reason);
});

const express = require('express');
const path = require('path');
const config = require('../config/config');
const { initDatabase } = require('../config/database');
const eventsRoutes = require('./routes/events');


let dbReady = false;

const app = express();

// Logger toutes les requêtes HTTP
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} => ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Servir les fichiers statiques (chemin absolu, garanti)
app.use(express.static(process.cwd() + '/public'));


// API (bloque si la base n'est pas prête)
app.use('/api/events', (req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Base de données non initialisée' });
  }
  next();
}, eventsRoutes);

// Fallback SPA : toute autre route non-API renvoie index.html
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(process.cwd() + '/public/index.html');
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Démarrer le serveur immédiatement
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Serveur calendrier API lancé sur le port ${config.port}`);
});

// Initialiser la base en arrière-plan
initDatabase()
  .then(() => {
    dbReady = true;
    console.log('✅ Base de données prête');
  })
  .catch((err) => {
    console.error('Erreur lors de l\'initialisation de la base :', err);
    // Ne pas arrêter le serveur, juste loguer l’erreur
  });
