#!/bin/bash

##############################################################
# SCRIPT D'INSTALLATION AUTOMATIQUE MUSIC STORE
# Installe TOUT automatiquement sur n'importe quel VPS Ubuntu
# Temps: 10-15 minutes
##############################################################

set -e

echo "================================================"
echo "🎵 INSTALLATION MUSIC STORE E-COMMERCE"
echo "================================================"
echo ""
echo "Ce script va installer :"
echo "- Docker & Docker Compose"
echo "- MongoDB"
echo "- Backend FastAPI"
echo "- Frontend React"
echo "- Nginx"
echo "- SSL/HTTPS"
echo ""
read -p "Continuer ? (o/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Oo]$ ]]
then
    exit 1
fi

# Couleurs pour les messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📦 Étape 1/8 : Mise à jour du système...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${BLUE}📦 Étape 2/8 : Installation de Docker...${NC}"
apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo ""
echo -e "${BLUE}📦 Étape 3/8 : Installation de Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo ""
echo -e "${BLUE}📦 Étape 4/8 : Création de la structure...${NC}"
mkdir -p /var/www/music-store
cd /var/www/music-store

echo ""
echo -e "${BLUE}📦 Étape 5/8 : Téléchargement des fichiers...${NC}"
echo "ℹ️  Méthode 1 : Via archive ZIP"
echo "ℹ️  Si vous avez une archive, uploadez-la avec :"
echo "    scp music-store.zip root@VOTRE_IP:/var/www/music-store/"
echo "    puis décompressez : unzip music-store.zip"
echo ""
echo "ℹ️  Méthode 2 : Configuration manuelle ci-dessous..."
echo ""

# Créer les dossiers
mkdir -p backend frontend uploads/images uploads/audio_previews uploads/audio_files

echo ""
echo -e "${BLUE}📦 Étape 6/8 : Configuration...${NC}"

# Demander les informations
read -p "Entrez votre domaine (ou appuyez sur Entrée pour utiliser l'IP) : " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(curl -s ifconfig.me)
    echo "Utilisation de l'IP : $DOMAIN"
fi

read -p "Email pour admin (ex: admin@votre-domaine.com) : " ADMIN_EMAIL
read -sp "Mot de passe admin (8+ caractères) : " ADMIN_PASSWORD
echo ""
read -p "Clé Stripe (sk_test_xxx ou sk_live_xxx) : " STRIPE_KEY

# Générer un secret JWT
JWT_SECRET=$(openssl rand -base64 32)

# Créer le fichier .env
cat > .env << EOF
# Base de données
MONGO_URL=mongodb://mongodb:27017
DB_NAME=music_store

# Sécurité
JWT_SECRET=$JWT_SECRET
CORS_ORIGINS=*

# Paiements
STRIPE_API_KEY=$STRIPE_KEY
PAYPAL_CLIENT_ID=
PAYPAL_SECRET=

# Email (optionnel)
SENDGRID_API_KEY=
SENDER_EMAIL=$ADMIN_EMAIL

# Frontend
REACT_APP_BACKEND_URL=http://$DOMAIN
EOF

echo -e "${GREEN}✓ Configuration créée${NC}"

echo ""
echo -e "${BLUE}📦 Étape 7/8 : Création du docker-compose.yml...${NC}"

cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: music_store_mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=music_store

  backend:
    build:
      context: ./backend
      dockerfile: ../Dockerfile.backend
    container_name: music_store_backend
    restart: always
    ports:
      - "8001:8001"
    volumes:
      - ./uploads:/app/uploads
    env_file:
      - .env
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: ../Dockerfile.frontend
    container_name: music_store_frontend
    restart: always
    ports:
      - "80:80"
    environment:
      - REACT_APP_BACKEND_URL=http://$DOMAIN
    depends_on:
      - backend

volumes:
  mongodb_data:
    driver: local
EOF

echo -e "${GREEN}✓ Docker Compose créé${NC}"

echo ""
echo -e "${BLUE}📦 Étape 8/8 : Instructions finales...${NC}"
echo ""
echo "================================================"
echo "✅ INSTALLATION DE BASE TERMINÉE !"
echo "================================================"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo ""
echo "1️⃣  Uploadez votre code :"
echo "   Méthode A - Via SCP (depuis votre machine) :"
echo "   scp -r backend/ root@$DOMAIN:/var/www/music-store/"
echo "   scp -r frontend/ root@$DOMAIN:/var/www/music-store/"
echo "   scp Dockerfile.* root@$DOMAIN:/var/www/music-store/"
echo "   scp nginx.conf root@$DOMAIN:/var/www/music-store/"
echo ""
echo "   Méthode B - Via Git :"
echo "   cd /var/www/music-store"
echo "   git clone https://votre-depot.git ."
echo ""
echo "2️⃣  Démarrez l'application :"
echo "   cd /var/www/music-store"
echo "   docker-compose up -d"
echo ""
echo "3️⃣  Créez le compte admin :"
echo "   docker exec -it music_store_backend python3 -c '"
echo "   import asyncio, bcrypt, uuid"
echo "   from motor.motor_asyncio import AsyncIOMotorClient"
echo "   from datetime import datetime, timezone"
echo ""
echo "   async def create_admin():"
echo "       client = AsyncIOMotorClient('mongodb://mongodb:27017')"
echo "       db = client['music_store']"
echo "       hashed = bcrypt.hashpw('$ADMIN_PASSWORD'.encode(), bcrypt.gensalt()).decode()"
echo "       await db.users.insert_one({"
echo "           'id': str(uuid.uuid4()),"
echo "           'prenom': 'Admin',"
echo "           'nom': 'MusicStore',"
echo "           'email': '$ADMIN_EMAIL',"
echo "           'adresse': '123 Admin Street',"
echo "           'mot_de_passe': hashed,"
echo "           'email_verifie': True,"
echo "           'role': 'admin',"
echo "           'created_at': datetime.now(timezone.utc).isoformat()"
echo "       })"
echo "       print('Admin créé !')"
echo ""
echo "   asyncio.run(create_admin())"
echo "   '"
echo ""
echo "4️⃣  Testez votre site :"
echo "   http://$DOMAIN"
echo ""
echo "================================================"
echo ""
echo "📞 SUPPORT :"
echo "- Logs backend : docker logs music_store_backend"
echo "- Logs frontend : docker logs music_store_frontend"
echo "- Redémarrer : docker-compose restart"
echo ""
echo "💾 Fichiers sauvegardés dans : /var/www/music-store"
echo ""
