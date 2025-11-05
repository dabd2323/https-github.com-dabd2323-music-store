#!/bin/bash

# Script de déploiement Hostinger VPS
# Usage: ./deploy-hostinger.sh [IP_VPS]

set -e

VPS_IP=$1

if [ -z "$VPS_IP" ]; then
    echo "Usage: ./deploy-hostinger.sh [IP_VPS]"
    echo "Exemple: ./deploy-hostinger.sh 154.12.34.56"
    exit 1
fi

echo "🚀 Déploiement sur Hostinger VPS: $VPS_IP"

# 1. Créer le répertoire sur le serveur
echo "1/5 Préparation du serveur..."
ssh root@"$VPS_IP" "mkdir -p /root/music-store"

# 2. Transférer les fichiers
echo "2/5 Transfert des fichiers..."
scp -r \
    backend \
    frontend \
    docker-compose.yml \
    Dockerfile.backend \
    Dockerfile.frontend \
    nginx.conf \
    .env.example \
    create_admin.py \
    root@"$VPS_IP":/root/music-store/

# 3. Installer Docker si nécessaire
echo "3/5 Installation de Docker..."
ssh root@"$VPS_IP" << 'ENDSSH'
    if ! command -v docker &> /dev/null; then
        echo "Installation de Docker et Docker Compose..."
        apt update
        apt install -y docker.io docker-compose git ufw
    else
        echo "Docker déjà installé ✓"
    fi
ENDSSH

# 4. Configurer le pare-feu
echo "4/5 Configuration du pare-feu..."
ssh root@"$VPS_IP" << 'ENDSSH'
    # Autoriser les ports nécessaires
    ufw --force enable
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw status
ENDSSH

# 5. Démarrer l'application
echo "5/5 Démarrage de l'application..."
ssh root@"$VPS_IP" << 'ENDSSH'
    cd /root/music-store
    
    # Créer .env s'il n'existe pas
    if [ ! -f .env ]; then
        cp .env.example .env
        echo ""
        echo "⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies clés:"
        echo "   - JWT_SECRET"
        echo "   - STRIPE_API_KEY"
        echo "   - SENDGRID_API_KEY"
        echo "   - REACT_APP_BACKEND_URL"
        echo ""
        echo "Commande: nano /root/music-store/.env"
        echo ""
    fi
    
    # Arrêter les anciens conteneurs
    docker-compose down 2>/dev/null || true
    
    # Démarrer les nouveaux
    docker-compose up -d --build
    
    echo "✅ Application démarrée!"
    echo ""
    docker-compose ps
ENDSSH

# Vérifier le déploiement
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Déploiement terminé avec succès!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Accédez à votre application:"
echo "   http://$VPS_IP"
echo ""
echo "🔑 Étapes suivantes:"
echo ""
echo "1. Modifiez le fichier .env avec vos vraies clés:"
echo "   ssh root@$VPS_IP"
echo "   nano /root/music-store/.env"
echo ""
echo "2. Redémarrez l'application après modification:"
echo "   docker-compose restart"
echo ""
echo "3. Créez le compte administrateur:"
echo "   docker exec -it music_store_backend python3 create_admin.py"
echo ""
echo "📝 Voir les logs:"
echo "   ssh root@$VPS_IP"
echo "   cd /root/music-store"
echo "   docker-compose logs -f"
echo ""
echo "🔒 Configurez SSL pour HTTPS (recommandé):"
echo "   ssh root@$VPS_IP"
echo "   apt install -y certbot python3-certbot-nginx"
echo "   certbot --nginx -d votre-domaine.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
