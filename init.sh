#!/bin/bash

# Script d'initialisation pour Register Manager API
# Ce script automatise la configuration complète du projet

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Initialisation de Register Manager API${NC}"
echo "========================================"

# Fonction pour afficher les messages
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier les prérequis
print_step "Vérification des prérequis"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez installer Node.js 18+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ requis. Version actuelle: $(node --version)"
    exit 1
fi
print_success "Node.js $(node --version) détecté"

# Vérifier npm
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi
print_success "npm $(npm --version) détecté"

# Vérifier Docker (optionnel)
if command -v docker &> /dev/null; then
    print_success "Docker $(docker --version | cut -d' ' -f3 | cut -d',' -f1) détecté"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker non détecté (optionnel pour base de données locale)"
    DOCKER_AVAILABLE=false
fi

# Vérifier Docker Compose (optionnel)
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    print_success "Docker Compose détecté"
    DOCKER_COMPOSE_AVAILABLE=true
else
    print_warning "Docker Compose non détecté (optionnel pour base de données locale)"
    DOCKER_COMPOSE_AVAILABLE=false
fi

# Installation des dépendances
print_step "Installation des dépendances Node.js"
npm install
print_success "Dépendances installées"

# Configuration de l'environnement
print_step "Configuration de l'environnement"

if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Fichier .env créé à partir de .env.example"
        print_warning "⚠️  IMPORTANT: Veuillez éditer le fichier .env avec vos propres valeurs"
    else
        print_error "Fichier .env.example non trouvé"
        exit 1
    fi
else
    print_warning "Fichier .env existe déjà, conservation des valeurs actuelles"
fi

# Demander si l'utilisateur veut utiliser Docker pour la base de données
if [ "$DOCKER_AVAILABLE" = true ] && [ "$DOCKER_COMPOSE_AVAILABLE" = true ]; then
    echo ""
    read -p "Voulez-vous utiliser Docker pour la base de données PostgreSQL ? (O/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Oo]$ ]] || [[ -z $REPLY ]]; then
        print_step "Démarrage de la base de données PostgreSQL avec Docker"
        docker-compose up -d manager-db
        print_success "Base de données PostgreSQL démarrée sur le port 5434"
        
        # Attendre que la base de données soit prête
        print_step "Attente que la base de données soit prête"
        sleep 10
        
        # Vérifier la connexion à la base de données
        MAX_ATTEMPTS=30
        ATTEMPT=1
        while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
            if docker-compose exec -T manager-db pg_isready -h localhost -p 5432 -U user &> /dev/null; then
                print_success "Base de données prête"
                break
            fi
            
            if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
                print_error "Impossible de se connecter à la base de données après $MAX_ATTEMPTS tentatives"
                exit 1
            fi
            
            echo -n "."
            sleep 2
            ATTEMPT=$((ATTEMPT + 1))
        done
        
        USE_DOCKER_DB=true
    else
        USE_DOCKER_DB=false
        print_warning "Configuration manuelle de la base de données requise"
        print_warning "Assurez-vous d'avoir PostgreSQL installé et configuré"
        print_warning "Mettez à jour DATABASE_URL dans le fichier .env"
    fi
else
    USE_DOCKER_DB=false
    print_warning "Docker non disponible - configuration manuelle de la base de données requise"
fi

# Installation du CLI Prisma globalement (si pas déjà installé)
print_step "Installation du CLI Prisma"
if ! command -v prisma &> /dev/null; then
    npm install -g prisma
    print_success "CLI Prisma installé globalement"
else
    print_success "CLI Prisma déjà disponible"
fi

# Génération du client Prisma
print_step "Génération du client Prisma"
if npx prisma generate 2>/dev/null; then
    print_success "Client Prisma généré"
else
    print_warning "Échec de la génération du client Prisma (problème réseau possible)"
    print_warning "Exécutez 'npx prisma generate' manuellement une fois le réseau configuré"
fi

# Migration de la base de données (si Docker est utilisé)
if [ "$USE_DOCKER_DB" = true ]; then
    print_step "Application des migrations de base de données"
    if npx prisma migrate deploy 2>/dev/null; then
        print_success "Migrations appliquées"
        
        # Seed de la base de données
        print_step "Initialisation des données de base (seed)"
        if npm run seed 2>/dev/null; then
            print_success "Données de base insérées"
        else
            print_warning "Échec du seed - Exécutez 'npm run seed' manuellement"
        fi
    else
        print_warning "Échec des migrations - Exécutez 'npx prisma migrate deploy' manuellement"
    fi
else
    print_warning "⚠️  Base de données manuelle détectée"
    print_warning "Exécutez manuellement les commandes suivantes une fois votre base configurée:"
    echo "  npx prisma generate"
    echo "  npx prisma migrate deploy"
    echo "  npm run seed"
fi

# Test de construction
print_step "Test de construction du projet"
if npm run build 2>/dev/null; then
    print_success "Construction réussie"
else
    print_warning "Échec de la construction - Normale si Prisma n'est pas généré"
    print_warning "Exécutez 'npm run build' après avoir configuré Prisma"
fi

# Vérification des scripts disponibles
print_step "Scripts npm disponibles"
echo "  npm run start:dev    - Démarrage en mode développement"
echo "  npm run start        - Démarrage en mode production"
echo "  npm run build        - Construction du projet"
echo "  npm run test         - Exécution des tests"
echo "  npm run test:cov     - Tests avec couverture"
echo "  npm run lint         - Vérification du code"
echo "  npm run seed         - Réinitialisation des données"

# Instructions finales
echo ""
echo -e "${GREEN}🎉 Initialisation terminée avec succès !${NC}"
echo "========================================"
echo ""
print_step "Prochaines étapes"

if [ "$USE_DOCKER_DB" = true ]; then
    echo "1. Vérifiez et modifiez le fichier .env si nécessaire"
    echo "2. Démarrez l'application: npm run start:dev"
    echo "3. Accédez à l'API: http://localhost:3000"
    echo ""
    echo "Compte super admin créé:"
    echo "  Email: admin@registerManager.com"
    echo "  Mot de passe: AdminPassword123!"
else
    echo "1. Configurez votre base de données PostgreSQL"
    echo "2. Mettez à jour DATABASE_URL dans le fichier .env"
    echo "3. Exécutez: npx prisma migrate deploy"
    echo "4. Exécutez: npm run seed"
    echo "5. Démarrez l'application: npm run start:dev"
fi

echo ""
print_warning "⚠️  IMPORTANT: Changez les valeurs par défaut dans .env avant la production !"
echo ""

# Afficher les informations de base de données Docker si utilisée
if [ "$USE_DOCKER_DB" = true ]; then
    echo -e "${BLUE}📊 Informations de la base de données Docker:${NC}"
    echo "  Host: localhost"
    echo "  Port: 5434"
    echo "  Database: mydb"
    echo "  Username: user"
    echo "  Password: password"
    echo ""
    echo "Commandes Docker utiles:"
    echo "  docker-compose up -d    - Démarrer tous les services"
    echo "  docker-compose down     - Arrêter tous les services"
    echo "  docker-compose logs     - Voir les logs"
fi

print_success "Setup terminé ! L'application est prête à être utilisée."