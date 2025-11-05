#!/bin/bash

# Script de configuration pour déploiement DigitalOcean via GitHub
# Ce script prépare votre projet pour le déploiement

set -e

echo "🌊 Configuration pour DigitalOcean App Platform"
echo "================================================"
echo ""

# Vérifier si on est dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

# 1. Créer le répertoire .do
echo "1/6 Création du répertoire de configuration..."
mkdir -p .do

# 2. Demander les informations
echo ""
echo "2/6 Configuration GitHub"
read -p "Nom d'utilisateur GitHub: " GITHUB_USER
read -p "Nom du repository: " GITHUB_REPO

echo ""
echo "3/6 Configuration des secrets"
read -p "JWT Secret (laissez vide pour générer): " JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    echo "   → JWT Secret généré: $JWT_SECRET"
fi

read -p "Clé Stripe (sk_live_...): " STRIPE_KEY
read -p "Clé SendGrid (optionnel): " SENDGRID_KEY
read -p "Email expéditeur: " SENDER_EMAIL

# 3. Créer le fichier app.yaml
echo ""
echo "4/6 Création du fichier app.yaml..."

cat > .do/app.yaml << EOF
name: music-store
region: fra

databases:
  - name: music-store-db
    engine: MONGODB
    version: "6"
    size: db-s-1vcpu-1gb

services:
  - name: backend
    github:
      repo: ${GITHUB_USER}/${GITHUB_REPO}
      branch: main
      deploy_on_push: true
    source_dir: /
    dockerfile_path: Dockerfile.backend
    
    envs:
      - key: MONGO_URL
        scope: RUN_AND_BUILD_TIME
        value: \${music-store-db.DATABASE_URL}
      - key: JWT_SECRET
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "${JWT_SECRET}"
      - key: STRIPE_API_KEY
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "${STRIPE_KEY}"
      - key: SENDGRID_API_KEY
        scope: RUN_AND_BUILD_TIME
        type: SECRET
        value: "${SENDGRID_KEY}"
      - key: SENDER_EMAIL
        scope: RUN_AND_BUILD_TIME
        value: "${SENDER_EMAIL}"
      - key: CORS_ORIGINS
        scope: RUN_AND_BUILD_TIME
        value: "*"
    
    http_port: 8001
    health_check:
      http_path: /api/products
    
    instance_count: 1
    instance_size_slug: basic-xs

static_sites:
  - name: frontend
    github:
      repo: ${GITHUB_USER}/${GITHUB_REPO}
      branch: main
      deploy_on_push: true
    source_dir: /
    dockerfile_path: Dockerfile.frontend
    
    envs:
      - key: REACT_APP_BACKEND_URL
        scope: BUILD_TIME
        value: \${backend.PUBLIC_URL}
    
    output_dir: /build
    
    routes:
      - path: /
EOF

echo "   ✓ Fichier .do/app.yaml créé"

# 4. Créer .gitignore si nécessaire
echo ""
echo "5/6 Vérification .gitignore..."

if [ ! -f ".gitignore" ]; then
    cat > .gitignore << EOF
# Dependencies
node_modules/
__pycache__/
*.pyc

# Environment
.env
.env.local

# Build
build/
dist/

# Uploads
uploads/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
EOF
    echo "   ✓ .gitignore créé"
else
    echo "   ✓ .gitignore existe déjà"
fi

# 5. Initialiser Git si nécessaire
echo ""
echo "6/6 Configuration Git..."

if [ ! -d ".git" ]; then
    git init
    echo "   ✓ Git initialisé"
fi

# Vérifier si le remote existe
if ! git remote get-url origin &> /dev/null; then
    git remote add origin "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
    echo "   ✓ Remote GitHub ajouté"
else
    echo "   ✓ Remote GitHub existe déjà"
fi

# Résumé
echo ""
echo "================================================"
echo "✅ Configuration terminée !"
echo "================================================"
echo ""
echo "📋 Prochaines étapes:"
echo ""
echo "1. Créez le repository sur GitHub:"
echo "   https://github.com/new"
echo "   Nom: ${GITHUB_REPO}"
echo ""
echo "2. Poussez votre code:"
echo "   git add ."
echo "   git commit -m 'Initial commit for DigitalOcean'"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. Déployez sur DigitalOcean:"
echo "   → Allez sur https://cloud.digitalocean.com/apps/new"
echo "   → Connectez votre repository GitHub"
echo "   → Sélectionnez ${GITHUB_USER}/${GITHUB_REPO}"
echo "   → Importez la config depuis .do/app.yaml"
echo "   → Lancez le déploiement !"
echo ""
echo "📄 Configuration sauvegardée dans .do/app.yaml"
echo ""
echo "🔑 Conservez ces informations:"
echo "   JWT_SECRET: ${JWT_SECRET}"
echo ""
echo "📚 Guide complet: DIGITALOCEAN_GITHUB_GUIDE.md"
echo ""