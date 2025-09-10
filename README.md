# Register Manager API

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<p align="center">
  API backend pour la gestion des inscriptions et des cours
  <br>
  Construite avec <a href="http://nestjs.com" target="_blank">NestJS</a>, <a href="https://www.prisma.io" target="_blank">Prisma</a> et <a href="https://www.postgresql.org" target="_blank">PostgreSQL</a>
</p>

## 📋 Description

Register Manager API est une application backend complète pour la gestion des inscriptions aux cours. Elle offre un système complet d'authentification, de gestion des utilisateurs, des cours, des inscriptions et des paiements.

### ✨ Fonctionnalités principales

- 🔐 **Authentification complète** avec JWT et vérification d'email
- 👥 **Gestion des utilisateurs** avec système de rôles (SUPER_ADMIN, ADMIN, USER)
- 📚 **Gestion des cours** avec informations détaillées
- 📝 **Système d'inscription** aux cours avec statuts
- 💳 **Gestion des paiements** avec support multi-devises
- 📧 **Service d'email** pour notifications et vérifications
- 🔄 **Intégration WhatsApp** pour communications
- 🛡️ **Rate limiting** et sécurité avancée
- 🧪 **Tests complets** avec couverture à 100%

## 🏗️ Architecture du Projet

### Technologies utilisées

| Technologie | Version | Description |
|-------------|---------|-------------|
| **NestJS** | ^11.0.1 | Framework Node.js TypeScript |
| **Prisma** | ^6.15.0 | ORM pour base de données |
| **PostgreSQL** | 15 | Base de données relationnelle |
| **JWT** | ^11.0.0 | Authentification par tokens |
| **Bcrypt** | ^6.0.0 | Hachage des mots de passe |
| **Nodemailer** | ^7.0.6 | Service d'envoi d'emails |
| **Jest** | ^29.7.0 | Framework de tests |
| **Docker** | - | Containerisation (optionnel) |

### Structure des modules

```
src/
├── auth/               # Module d'authentification
│   ├── dto/           # Objets de transfert de données
│   ├── guards/        # Guards de sécurité
│   └── services/      # Services métier
├── user/              # Gestion des utilisateurs
├── admin/             # Administration
├── course/            # Gestion des cours
├── registration/      # Système d'inscription
├── payment/           # Gestion des paiements
├── mail/              # Service d'email
├── whatsapp/          # Intégration WhatsApp
├── common/            # Utilitaires partagés
└── main.ts            # Point d'entrée
```

## 🚀 Installation Rapide

### Prérequis

- **Node.js** 18+ ([Télécharger](https://nodejs.org/))
- **npm** (inclus avec Node.js)
- **PostgreSQL** (ou Docker pour utiliser la base fournie)
- **Git**

### Installation automatisée

```bash
# Cloner le projet
git clone https://github.com/Romaric-py/register-manager-api.git
cd register-manager-api

# Exécuter le script d'initialisation
./init.sh
```

Le script `init.sh` automatise :
- ✅ Vérification des prérequis
- ✅ Installation des dépendances
- ✅ Configuration de l'environnement
- ✅ Démarrage de la base de données (Docker)
- ✅ Génération du client Prisma
- ✅ Migrations de base de données
- ✅ Insertion des données initiales
- ✅ Construction du projet

### Installation manuelle

Si vous préférez configurer manuellement :

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# 3. Démarrer PostgreSQL (avec Docker)
docker-compose up -d manager-db

# 4. Générer le client Prisma
npx prisma generate

# 5. Appliquer les migrations
npx prisma migrate deploy

# 6. Insérer les données initiales
npm run seed

# 7. Construire le projet
npm run build
```

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5434/mydb

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRY=1800000  # 30 minutes
JWT_REFRESH_TOKEN_EXPIRY=604800000  # 7 jours

# Email SMTP
MAIL_HOST=smtp.gmail.com
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Super Admin (pour le seed)
SUPER_ADMIN_EMAIL=admin@registerManager.com
SUPER_ADMIN_PASSWORD=AdminPassword123!
```

📖 **Documentation complète** : Voir [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### Base de données

#### Option 1 : Docker (Recommandé)

```bash
# Démarrer PostgreSQL
docker-compose up -d manager-db

# Vérifier le statut
docker-compose ps
```

#### Option 2 : PostgreSQL local

```bash
# Installer PostgreSQL
sudo apt install postgresql postgresql-contrib  # Ubuntu/Debian
brew install postgresql  # macOS

# Créer une base de données
createdb mydb

# Mettre à jour DATABASE_URL dans .env
```

## 🏃‍♂️ Utilisation

### Démarrage de l'application

```bash
# Mode développement (avec rechargement automatique)
npm run start:dev

# Mode production
npm run start:prod

# Mode debug
npm run start:debug
```

L'API sera accessible sur `http://localhost:3000`

### Endpoints principaux

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/auth/register` | POST | Inscription d'un utilisateur |
| `/auth/login` | POST | Connexion |
| `/auth/verify-email` | POST | Vérification d'email |
| `/users` | GET | Liste des utilisateurs |
| `/courses` | GET | Liste des cours |
| `/registrations` | POST | Inscription à un cours |
| `/payments` | POST | Traitement des paiements |

### Compte administrateur

Après le seed, un compte super admin est créé :
- **Email** : `admin@registerManager.com`
- **Mot de passe** : `AdminPassword123!`

⚠️ **Changez ces identifiants en production !**

## 🧪 Tests

### Exécution des tests

```bash
# Tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:cov

# Tests E2E
npm run test:e2e

# Tests d'un module spécifique
npm test auth
npm test registration
```

### Couverture actuelle

- **Module Auth** : 100% de couverture
- **Module Registration** : Tests complets
- **Tests d'intégration** : E2E pour tous les endpoints

## 🔒 Sécurité

### Fonctionnalités de sécurité

- **JWT** avec refresh tokens
- **Hachage bcrypt** pour les mots de passe
- **Rate limiting** configurable
- **Validation des données** avec class-validator
- **CORS** configurable
- **Guards** pour l'autorisation
- **Filtres d'exception** Prisma

### Bonnes pratiques

- Mots de passe forts requis
- Vérification d'email obligatoire
- Tokens avec expiration
- Gestion des erreurs sécurisée
- Variables d'environnement pour les secrets

## 📦 Scripts npm

| Script | Description |
|--------|-------------|
| `npm run start` | Démarrage normal |
| `npm run start:dev` | Mode développement |
| `npm run start:prod` | Mode production |
| `npm run build` | Construction |
| `npm run test` | Tests unitaires |
| `npm run test:cov` | Tests avec couverture |
| `npm run test:e2e` | Tests E2E |
| `npm run lint` | Vérification du code |
| `npm run format` | Formatage du code |
| `npm run seed` | Réinitialiser les données |

## 🐳 Docker

### Base de données seule

```bash
# Démarrer uniquement PostgreSQL
docker-compose up -d manager-db

# Arrêter
docker-compose down
```

### Application complète (TODO)

```bash
# Construction de l'image
docker build -t register-manager-api .

# Démarrage complet
docker-compose up -d
```

## 📊 Base de Données

### Modèles principaux

- **User** : Utilisateurs avec rôles et authentification
- **Course** : Cours avec prix, dates, et descriptions
- **Registration** : Inscriptions aux cours avec statuts
- **Payment** : Paiements avec méthodes et devises
- **RefreshToken** : Tokens de renouvellement JWT

### Migrations

```bash
# Créer une nouvelle migration
npx prisma migrate dev --name "description"

# Appliquer les migrations
npx prisma migrate deploy

# Réinitialiser la base
npx prisma migrate reset
```

### Prisma Studio

```bash
# Interface graphique pour la base de données
npx prisma studio
```

## 🚀 Déploiement

### Prérequis production

- Serveur Node.js 18+
- Base de données PostgreSQL
- Variables d'environnement sécurisées
- Service SMTP configuré
- Domaine avec HTTPS

### Variables importantes pour la production

```bash
NODE_ENV=production
JWT_SECRET=ultra-secure-secret
DATABASE_URL=postgresql://user:password@prod-db:5432/dbname
FRONTEND_URL=https://your-domain.com
MAIL_HOST=your-smtp-server.com
```

### Commandes de déploiement

```bash
# Construction optimisée
npm run build

# Démarrage production
npm run start:prod

# Avec PM2 (recommandé)
pm2 start dist/main.js --name register-manager-api
```

## 📚 Documentation API

### Génération de la documentation

```bash
# Démarrer l'application
npm run start:dev

# Accéder à la documentation Swagger (si configuré)
# http://localhost:3000/api/docs
```

### Postman Collection

Une collection Postman est disponible dans le dossier `docs/` (à créer) avec tous les endpoints configurés.

## 🤝 Contribution

### Guide de contribution

1. **Fork** le projet
2. **Créez** une branche feature (`git checkout -b feature/AmazingFeature`)
3. **Commitez** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrez** une Pull Request

### Standards de code

- **ESLint** : Configuration TypeScript stricte
- **Prettier** : Formatage automatique
- **Tests** : Couverture requise pour nouveau code
- **Commits** : Messages descriptifs en français

## 🆘 Aide et Support

### Problèmes courants

#### Erreur de connexion à la base de données
```bash
# Vérifier que PostgreSQL fonctionne
docker-compose ps
docker-compose logs manager-db

# Recréer la base
docker-compose down
docker-compose up -d manager-db
```

#### Erreurs Prisma
```bash
# Régénérer le client
npx prisma generate

# Réappliquer les migrations
npx prisma migrate reset
```

#### Problèmes de build
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Logs et debugging

```bash
# Logs de l'application
npm run start:debug

# Logs Docker
docker-compose logs -f

# Tests en mode debug
npm run test:debug
```

## 📄 Licence

Ce projet est sous licence **UNLICENSED** - voir le fichier [package.json](./package.json) pour plus de détails.

## 📞 Contact

- **Auteur** : Équipe Register Manager
- **Email** : admin@registerManager.com
- **Repository** : [https://github.com/Romaric-py/register-manager-api](https://github.com/Romaric-py/register-manager-api)

---

<p align="center">
  Développé avec ❤️ et <a href="http://nestjs.com" target="_blank">NestJS</a>
</p>