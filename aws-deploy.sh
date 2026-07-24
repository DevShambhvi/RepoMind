#!/bin/bash
# ==============================================================================
# RepoMind AWS EC2 One-Click Deployment Script
# Tested on Ubuntu 22.04 LTS & Ubuntu 24.04 LTS
# ==============================================================================

set -e

echo "🚀 Starting RepoMind AWS Deployment..."

# 1. Update system packages & clean package caches
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git
sudo apt-get clean && sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* || true

# 1.5 Setup 2GB Swap File for AWS Free Tier (t2.micro / t3.micro 1GB RAM safety)
if [ ! -f /swapfile ]; then
    echo "🧠 Configuring 2GB Swap file for AWS Free Tier memory safety..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab || true
fi

# 2. Install Docker & Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
fi

# 3. Create .env file for Docker Compose if missing
if [ ! -f .env ]; then
    echo "📝 Creating production .env file..."
    read -p "Enter GEMINI_API_KEY: " gemini_key
    read -p "Enter GITHUB_TOKEN (optional): " github_token
    PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "localhost")
    
    cat <<EOF > .env
GEMINI_API_KEY=${gemini_key}
GITHUB_TOKEN=${github_token}
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:8000
EOF
    echo "✅ .env created with NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}:8000"
fi

# 4. Build and Start Docker Containers
echo "🧹 Cleaning unused Docker cache & build snapshots..."
sudo docker system prune -af --volumes || true
sudo docker builder prune -af || true

echo "⚡ Building and starting RepoMind containers..."
sudo docker compose build
sudo docker compose up -d

echo "======================================================================"
echo "🎉 RepoMind is LIVE on AWS!"
echo "----------------------------------------------------------------------"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "localhost")
echo "🌐 Frontend Web App: http://${PUBLIC_IP}:3000"
echo "⚙️ Backend API Server: http://${PUBLIC_IP}:8000"
echo "📄 Swagger API Docs: http://${PUBLIC_IP}:8000/docs"
echo "======================================================================"
