#!/bin/bash

##############################################
# WooMate Deployment Script
# Versiune: 1.0.0
# Autor: WooMate Team
##############################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Banner
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                       ║${NC}"
echo -e "${BLUE}║   ${GREEN}WooMate Deployment Script${BLUE}         ║${NC}"
echo -e "${BLUE}║   ${GREEN}Version 1.0.0${BLUE}                     ║${NC}"
echo -e "${BLUE}║                                       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "This script should not be run as root"
   print_info "Please run as regular user with sudo privileges"
   exit 1
fi

# Step 1: Check Prerequisites
echo "📋 Step 1: Checking Prerequisites"
echo "------------------------------------"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    print_info "Install with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js installed: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm -v)
print_success "npm installed: $NPM_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed"
    print_info "Install with: sudo apt install -y postgresql postgresql-contrib"
    exit 1
fi
PG_VERSION=$(psql --version | awk '{print $3}')
print_success "PostgreSQL installed: $PG_VERSION"

echo ""

# Step 2: Environment Configuration
echo "🔐 Step 2: Environment Configuration"
echo "--------------------------------------"

if [ ! -f .env ]; then
    print_error ".env file not found"
    print_info "Please create .env from .env.example:"
    print_info "  cp .env.example .env"
    print_info "  nano .env  # Edit with your values"
    exit 1
fi
print_success ".env file found"

# Load .env
set -a
source .env
set +a

# Check critical variables
MISSING_VARS=()

if [ -z "$DATABASE_URL" ]; then MISSING_VARS+=("DATABASE_URL"); fi
if [ -z "$JWT_SECRET" ]; then MISSING_VARS+=("JWT_SECRET"); fi
if [ -z "$CARGUS_USERNAME" ]; then MISSING_VARS+=("CARGUS_USERNAME"); fi
if [ -z "$SMARTBILL_TOKEN" ]; then MISSING_VARS+=("SMARTBILL_TOKEN"); fi
if [ -z "$SENDGRID_API_KEY" ]; then MISSING_VARS+=("SENDGRID_API_KEY"); fi

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing critical environment variables:"
    for VAR in "${MISSING_VARS[@]}"; do
        echo "  - $VAR"
    done
    exit 1
fi

print_success "All critical environment variables are set"
echo ""

# Step 3: Install Dependencies
echo "📦 Step 3: Installing Dependencies"
echo "------------------------------------"

if [ "$NODE_ENV" == "production" ]; then
    print_info "Installing production dependencies..."
    npm ci --production --silent
else
    print_info "Installing all dependencies..."
    npm ci --silent
fi

print_success "Dependencies installed"
echo ""

# Step 4: Database Setup
echo "🗄️  Step 4: Database Setup"
echo "-------------------------"

print_info "Generating Prisma Client..."
npx prisma generate > /dev/null 2>&1

if [ "$NODE_ENV" == "production" ]; then
    print_info "Running database migrations (deploy mode)..."
    npx prisma migrate deploy
else
    print_info "Running database migrations (dev mode)..."
    npx prisma migrate dev --name init
fi

print_success "Database setup complete"

# Ask if user wants to seed database
read -p "Do you want to seed the database with default data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Seeding database..."
    npm run db:seed
    print_success "Database seeded"
fi

echo ""

# Step 5: Build Application
echo "🔨 Step 5: Building Application"
echo "--------------------------------"

print_info "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build successful"
else
    print_error "Build failed"
    exit 1
fi

echo ""

# Step 6: Setup Process Manager (PM2)
echo "⚙️  Step 6: Process Manager Setup"
echo "----------------------------------"

if ! command -v pm2 &> /dev/null; then
    print_warning "PM2 not found. Installing globally..."
    sudo npm install -g pm2
fi

# Stop existing process
pm2 delete woomate 2>/dev/null || true

# Start application
print_info "Starting application with PM2..."
pm2 start npm --name "woomate" -- start
pm2 save

# Setup startup script
print_info "Configuring PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

print_success "PM2 configured"
echo ""

# Step 7: Nginx Setup (if installed)
if command -v nginx &> /dev/null; then
    echo "🌐 Step 7: Nginx Configuration"
    echo "-------------------------------"
    
    if [ ! -z "$NEXT_PUBLIC_APP_URL" ]; then
        DOMAIN=$(echo $NEXT_PUBLIC_APP_URL | sed 's|https\?://||')
        
        print_info "Domain detected: $DOMAIN"
        
        # Check if Nginx config exists
        if [ ! -f "/etc/nginx/sites-available/woomate" ]; then
            print_info "Creating Nginx configuration..."
            
            sudo tee /etc/nginx/sites-available/woomate > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
            
            # Enable site
            sudo ln -s /etc/nginx/sites-available/woomate /etc/nginx/sites-enabled/ 2>/dev/null || true
            
            # Test and reload Nginx
            sudo nginx -t
            sudo systemctl reload nginx
            
            print_success "Nginx configured"
            
            # SSL with Certbot
            if command -v certbot &> /dev/null; then
                read -p "Do you want to setup SSL with Let's Encrypt? (y/N) " -n 1 -r
                echo
                if [[ $REPLY =~ ^[Yy]$ ]]; then
                    print_info "Setting up SSL..."
                    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN
                    print_success "SSL configured"
                fi
            fi
        else
            print_info "Nginx configuration already exists"
        fi
    fi
    echo ""
fi

# Step 8: Final Checks
echo "🔍 Step 8: Final Checks"
echo "----------------------"

# Check if app is running
sleep 2
if pm2 list | grep -q "woomate.*online"; then
    print_success "Application is running"
else
    print_error "Application is not running"
    pm2 logs woomate --lines 50
    exit 1
fi

# Check if app responds
if curl -s http://localhost:3000 > /dev/null; then
    print_success "Application responds on port 3000"
else
    print_warning "Application doesn't respond yet (might need more time to start)"
fi

echo ""

# Summary
echo "╔═══════════════════════════════════════╗"
echo "║                                       ║"
echo "║   ${GREEN}✅ Deployment Complete!${NC}            ║"
echo "║                                       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

print_info "Application URL: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
print_info "Database: PostgreSQL"
print_info "Process Manager: PM2"
echo ""

print_info "Useful Commands:"
echo "  pm2 status        - Check application status"
echo "  pm2 logs woomate  - View application logs"
echo "  pm2 restart woomate - Restart application"
echo "  pm2 stop woomate  - Stop application"
echo "  pm2 monit         - Monitor resources"
echo ""

print_warning "⚠️  SECURITY REMINDERS:"
echo "  1. Change default admin password immediately"
echo "  2. Verify all API credentials in .env"
echo "  3. Setup database backups"
echo "  4. Enable firewall (ufw)"
echo "  5. Setup monitoring (optional)"
echo ""

print_info "Next Steps:"
echo "  1. Visit: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
echo "  2. Login with admin credentials from .env"
echo "  3. Add your first tenant"
echo "  4. Configure WooCommerce webhooks"
echo "  5. Test order processing flow"
echo ""

print_success "Happy automating! 🚀"
