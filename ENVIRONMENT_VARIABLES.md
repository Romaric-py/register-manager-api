# Variables d'Environnement - Register Manager API

Ce fichier documente toutes les variables d'environnement utilisées dans l'application Register Manager API.

## 🌍 Configuration de Base

### `NODE_ENV`
- **Type**: `string`
- **Valeurs**: `development` | `production` | `test`
- **Défaut**: `development`
- **Description**: Définit l'environnement d'exécution de l'application

### `PORT`
- **Type**: `number`
- **Défaut**: `3000`
- **Description**: Port sur lequel l'application écoute

### `HOST`
- **Type**: `string`
- **Défaut**: `localhost`
- **Description**: Hostname de l'application

## 🔒 Configuration CORS

### `CORS_ORIGINS`
- **Type**: `string` (séparés par des virgules)
- **Défaut**: `http://localhost:3000,http://localhost:3001`
- **Description**: Liste des origines autorisées pour les requêtes CORS
- **Exemple**: `https://monsite.com,https://www.monsite.com`

## 🗄️ Base de Données

### `DATABASE_URL`
- **Type**: `string`
- **Requis**: ✅
- **Description**: URL de connexion à la base de données PostgreSQL
- **Format**: `postgresql://username:password@host:port/database`

## 🔐 Configuration JWT

### `JWT_SECRET`
- **Type**: `string`
- **Requis**: ✅
- **Description**: Clé secrète pour signer les tokens d'accès JWT

### `JWT_EXPIRES_IN`
- **Type**: `string`
- **Défaut**: `15m`
- **Description**: Durée de vie des tokens d'accès
- **Format**: `1h`, `30m`, `60s`

### `JWT_REFRESH_SECRET`
- **Type**: `string`
- **Requis**: ✅
- **Description**: Clé secrète pour signer les refresh tokens

### `JWT_REFRESH_EXPIRES_IN`
- **Type**: `string`
- **Défaut**: `7d`
- **Description**: Durée de vie des refresh tokens

## ⏱️ Configuration des Tokens (en millisecondes)

### `ACCESS_TOKEN_LIFESPAN_MS`
- **Type**: `number`
- **Défaut**: `900000` (15 minutes)
- **Description**: Durée de vie des cookies d'accès en millisecondes

### `REFRESH_TOKEN_LIFESPAN_MS`
- **Type**: `number`
- **Défaut**: `2592000000` (30 jours)
- **Description**: Durée de vie des cookies de refresh en millisecondes

## 📧 Configuration de Vérification Email

### `EMAIL_VERIFICATION_TOKEN_EXPIRY_MS`
- **Type**: `number`
- **Défaut**: `86400000` (24 heures)
- **Description**: Durée de validité des tokens de vérification email

### `EMAIL_VERIFICATION_RESEND_COOLDOWN_MS`
- **Type**: `number`
- **Défaut**: `300000` (5 minutes)
- **Description**: Délai minimum entre deux envois de vérification email

## 🔑 Configuration de Réinitialisation de Mot de Passe

### `PASSWORD_RESET_TOKEN_EXPIRY_MS`
- **Type**: `number`
- **Défaut**: `900000` (15 minutes)
- **Description**: Durée de validité des tokens de réinitialisation de mot de passe

## 🚦 Configuration du Rate Limiting (Throttling)

### `THROTTLER_SHORT_TTL`
- **Type**: `number`
- **Défaut**: `60000` (1 minute)
- **Description**: Fenêtre de temps pour les limites courtes

### `THROTTLER_SHORT_LIMIT`
- **Type**: `number`
- **Défaut**: `10`
- **Description**: Nombre de requêtes autorisées dans la fenêtre courte

### `THROTTLER_MEDIUM_TTL`
- **Type**: `number`
- **Défaut**: `600000` (10 minutes)
- **Description**: Fenêtre de temps pour les limites moyennes

### `THROTTLER_MEDIUM_LIMIT`
- **Type**: `number`
- **Défaut**: `20`
- **Description**: Nombre de requêtes autorisées dans la fenêtre moyenne

## 📬 Configuration Email (SMTP)

### `MAIL_HOST`
- **Type**: `string`
- **Défaut**: `smtp.gmail.com`
- **Description**: Serveur SMTP pour l'envoi d'emails

### `MAIL_PORT`
- **Type**: `number`
- **Défaut**: `587`
- **Description**: Port du serveur SMTP

### `MAIL_SECURE`
- **Type**: `boolean`
- **Défaut**: `false`
- **Description**: Utiliser SSL/TLS pour la connexion SMTP

### `MAIL_USER`
- **Type**: `string`
- **Requis**: ✅
- **Description**: Nom d'utilisateur pour l'authentification SMTP

### `MAIL_PASSWORD`
- **Type**: `string`
- **Requis**: ✅
- **Description**: Mot de passe pour l'authentification SMTP

### `MAIL_FROM_NAME`
- **Type**: `string`
- **Défaut**: `Register Manager`
- **Description**: Nom de l'expéditeur des emails

### `MAIL_FROM_ADDRESS`
- **Type**: `string`
- **Défaut**: `noreply@registerManager.com`
- **Description**: Adresse email de l'expéditeur

## 🌐 URLs

### `FRONTEND_URL`
- **Type**: `string`
- **Requis**: ✅
- **Description**: URL de base du frontend pour générer les liens dans les emails
- **Exemple**: `https://monapp.com`

## 📝 Notes d'Utilisation

### Développement
1. Copiez `.env.example` vers `.env`
2. Remplissez les valeurs requises (marquées ✅)
3. Ajustez les autres valeurs selon vos besoins

### Production
- Utilisez des valeurs sécurisées pour tous les secrets
- Définissez `NODE_ENV=production`
- Utilisez HTTPS pour `FRONTEND_URL`
- Configurez un serveur SMTP fiable

### Durées Recommandées
- **Access Token**: 15-30 minutes
- **Refresh Token**: 7-30 jours
- **Email Verification**: 24-48 heures
- **Password Reset**: 15-60 minutes
