#!/bin/bash
# ==============================================================================
# RepoMind AWS EC2 Production Deployment Script
# Optimized for AWS Free Tier (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================

set -e

echo "🚀 Starting RepoMind AWS Deployment..."

# 1. Expand EBS root partition if available & clean system caches
echo "📦 Optimizing system disk space..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git
sudo apt-get clean && sudo rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* || true

# 1.5 Setup 2GB Swap File for memory safety (1GB RAM instances)
if [ ! -f /swapfile ]; then
    echo "🧠 Configuring 2GB Swap file for AWS Free Tier memory safety..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab || true
fi

# 2. Install Node.js 20 LTS for Host Frontend Execution
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js on Host..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 3. Install Docker for Backend Service
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
fi

# 4. Create environment file if missing
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

# 5. Clean Docker cache and build Backend Container
echo "🧹 Purging unused Docker layer cache..."
sudo docker system prune -af --volumes || true
sudo docker builder prune -af || true

echo "⚡ Starting FastAPI Backend Container..."
sudo docker compose up -d --build backend

# 6. Build and Start Frontend on Host (Zero Docker Disk Overhead)
echo "🎨 Building & Launching Next.js Frontend on Host..."
cd repomind-frontend
npm install --omit=dev --no-audit --no-fund
npm run build

# Kill any previous node server process running on 3000
npx kill-port 3000 || true
nohup npm run start -- -p 3000 > ../frontend.log 2>&1 &
cd ..

echo "======================================================================"
echo "🎉 RepoMind is LIVE on AWS!"
echo "----------------------------------------------------------------------"
PUBLIC_IP=$(curl -s http://checkip.amazonaws.com || echo "localhost")
echo "🌐 Frontend Web App: http://${PUBLIC_IP}:3000"
echo "⚙️ Backend API Server: http://${PUBLIC_IP}:8000"
echo "📄 Swagger API Docs: http://${PUBLIC_IP}:8000/docs"
echo "======================================================================"
