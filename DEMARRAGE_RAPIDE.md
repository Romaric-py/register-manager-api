# 🚀 Guide de Démarrage Rapide - Register Manager API

Ce guide vous permet de démarrer rapidement avec Register Manager API.

## ⚡ Installation Express (5 minutes)

```bash
# 1. Cloner le projet
git clone https://github.com/Romaric-py/register-manager-api.git
cd register-manager-api

# 2. Exécuter le script d'initialisation
./init.sh

# 3. Démarrer l'application
npm run start:dev
```

L'API sera disponible sur `http://localhost:3000`

## 📋 Prérequis

- **Node.js 18+** ([Installer](https://nodejs.org/))
- **PostgreSQL** (ou Docker pour utiliser la base fournie)

## 🔑 Premier Connexion

Après l'installation, utilisez ces identifiants pour tester l'API :

- **Email** : `admin@registerManager.com`
- **Mot de passe** : `AdminPassword123!`

⚠️ **Changez ces identifiants avant la production !**

## 🐳 Avec Docker (Recommandé)

```bash
# Démarrer PostgreSQL
docker-compose up -d manager-db

# Vérifier que la base fonctionne
docker-compose ps
```

## 🔧 Configuration Minimale

Éditez le fichier `.env` :

```bash
# Base de données (si vous utilisez Docker)
DATABASE_URL=postgresql://user:password@localhost:5434/mydb

# Changez cette clé en production !
JWT_SECRET=your-super-secret-jwt-key

# Configuration email (Gmail exemple)
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

## 📚 Endpoints Principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `POST /auth/register` | POST | Inscription |
| `POST /auth/login` | POST | Connexion |
| `GET /courses` | GET | Liste des cours |
| `POST /registrations` | POST | S'inscrire à un cours |

## 🆘 Problèmes Courants

### "Cannot connect to database"
```bash
# Vérifier PostgreSQL
docker-compose logs manager-db
docker-compose restart manager-db
```

### "Prisma client not generated"
```bash
npx prisma generate
npm run build
```

### "JWT secret not set"
Éditez `.env` et définissez `JWT_SECRET=your-secret-key`

## 📞 Aide

- **Documentation complète** : Voir [README.md](./README.md)
- **Analyse technique** : Voir [ANALYSE_PROJET.md](./ANALYSE_PROJET.md)
- **Variables d'environnement** : Voir [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

## ✅ Vérification

Pour vérifier que tout fonctionne :

```bash
# Tests
npm run test

# Lancer l'application
npm run start:dev

# Tester une requête
curl http://localhost:3000/auth/health
```

Si vous voyez une réponse JSON, votre installation est réussie ! 🎉