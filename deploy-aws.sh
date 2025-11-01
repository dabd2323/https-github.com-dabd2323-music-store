#!/bin/bash

# Script de déploiement automatique AWS EC2
# Usage: ./deploy-aws.sh [EC2_IP] [PEM_KEY_PATH]

set -e

EC2_IP=$1
PEM_KEY=$2

if [ -z "$EC2_IP" ] || [ -z "$PEM_KEY" ]; then
    echo "Usage: ./deploy-aws.sh [EC2_IP] [PEM_KEY_PATH]"
    echo "Exemple: ./deploy-aws.sh 54.123.45.67 ~/my-key.pem"
    exit 1
fi

echo "🚀 Déploiement sur AWS EC2: $EC2_IP"

# 1. Créer le répertoire sur le serveur
echo "1/5 Préparation du serveur..."
ssh -i "$PEM_KEY" ubuntu@"$EC2_IP" "mkdir -p ~/music-store"

# 2. Transférer les fichiers
echo "2/5 Transfert des fichiers..."
scp -i "$PEM_KEY" -r \
    backend \
    frontend \
    docker-compose.yml \
    Dockerfile.backend \
    Dockerfile.frontend \
    nginx.conf \
    .env.example \
    ubuntu@"$EC2_IP":~/music-store/

# 3. Installer Docker si nécessaire
echo "3/5 Vérification de Docker..."
ssh -i "$PEM_KEY" ubuntu@"$EC2_IP" << 'ENDSSH'
    if ! command -v docker &> /dev/null; then
        echo "Installation de Docker..."
        sudo apt update
        sudo apt install -y docker.io docker-compose
        sudo usermod -aG docker ubuntu
    fi
ENDSSH

# 4. Démarrer l'application
echo "4/5 Démarrage de l'application..."
ssh -i "$PEM_KEY" ubuntu@"$EC2_IP" << 'ENDSSH'
    cd ~/music-store
    
    # Créer .env s'il n'existe pas
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "ATTENTION: Modifiez le fichier .env avec vos vraies clés!"
    fi
    
    # Arrêter les anciens conteneurs
    docker-compose down 2>/dev/null || true
    
    # Démarrer les nouveaux
    docker-compose up -d --build
    
    echo "✅ Application démarrée!"
    docker-compose ps
ENDSSH

# 5. Vérifier le déploiement
echo "5/5 Vérification..."
sleep 5
echo "
🎉 Déploiement terminé!"
echo "
🌐 Accédez à votre application:"
echo "   http://$EC2_IP"
echo "
🔑 Créez le compte admin:"
echo "   ssh -i $PEM_KEY ubuntu@$EC2_IP"
echo "   cd ~/music-store"
echo "   docker exec -it music_store_backend python3 create_admin.py"
echo "
📝 Logs:"
echo "   docker-compose logs -f"
echo ""