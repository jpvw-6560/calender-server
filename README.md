# calendar_server

Application Node.js MVC pour la gestion d’un calendrier familial (congés, jours fériés, garde, déchets, rendez-vous, etc.).

## Structure du projet

- `config/` : configuration (config.js, database.js)
- `controllers/` : logique métier (controllers)
- `models/` : modèles de données
- `public/` : fichiers statiques (CSS, JS, images)
- `src/` : routes, vues, point d’entrée (server.js)
- `.env` : variables d’environnement
- `Dockerfile`, `docker-compose.yml` : conteneurisation

## Lancement local

```bash
npm install
npm run dev
```

## Lancement avec Docker

```bash
docker-compose up --build
```

## Variables d’environnement

Voir le fichier `.env` pour la configuration de la base de données et du port.
