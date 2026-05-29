#!/bin/bash
# Setup script for VPS production deployment

echo "🚀 CtrlMaster WhatsApp API - VPS Setup"
echo "======================================"

# Create directories
echo "📁 Creating directories..."
mkdir -p /root/ctrlmaster-whatsapp-api
mkdir -p /root/ctrlmaster-whatsapp-api/sessions
mkdir -p /root/ctrlmaster-whatsapp-api/logs

# Check Node.js
echo "🔍 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "✅ Node.js $(node -v)"

# Copy files
echo "📦 Copying project files..."
# (Run this from the project directory)

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build
echo "🔨 Building..."
npm run build

# Setup systemd service
echo "⚙️ Setting up systemd service..."
cp ctrlmaster-whatsapp.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable ctrlmaster-whatsapp
systemctl start ctrlmaster-whatsapp

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Useful commands:"
echo "  systemctl status ctrlmaster-whatsapp  # Check status"
echo "  journalctl -u ctrlmaster-whatsapp -f  # View logs"
echo "  systemctl restart ctrlmaster-whatsapp # Restart"
echo ""
echo "🔐 Don't forget to:"
echo "  1. Set WHATSAPP_API_KEY in /root/ctrlmaster-whatsapp-api/.env"
echo "  2. Open port 3001 in your firewall"
echo "  3. Scan QR code on first run"
