# 🚀 WooMate - Complete WooCommerce Automation Platform

**Versiune:** 1.0.0  
**Status:** Production Ready  
**Tehnologii:** Next.js 15, React 19, PostgreSQL, Prisma ORM

---

## 📋 Cuprins

1. [Despre WooMate](#despre-woomate)
2. [Caracteristici](#caracteristici)
3. [Cerințe Sistem](#cerințe-sistem)
4. [Instalare](#instalare)
5. [Configurare](#configurare)
6. [Deployment](#deployment)
7. [Integrări API](#integrări-api)
8. [Structura Proiectului](#structura-proiectului)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Despre WooMate

WooMate este o platformă completă de automatizare pentru magazine WooCommerce. Sincronizează comenzile automat, generează AWB-uri cu **Cargus**, emite facturi prin **SmartBill** și trimite notificări email clienților.

### Ce face WooMate:

✅ **Sincronizare automată** comenzi din WooCommerce  
✅ **Generare AWB** automat cu Cargus  
✅ **Emitere facturi** prin SmartBill  
✅ **Notificări email** automate către clienți  
✅ **Dashboard** pentru monitorizare comenzi  
✅ **Multi-tenant** - gestionează multiple magazine  
✅ **Webhooks** pentru actualizări în timp real  
✅ **Tracking** colete și facturi  

---

## ⚡ Caracteristici

### 🛍️ Gestionare Comenzi
- Import automat comenzi din WooCommerce
- Procesare automată sau manuală
- Tracking status comenzi în timp real
- Istoric complet activități

### 📦 Expedieri (Cargus)
- Generare AWB automat
- Calcul cost transport
- Tracking colete
- Imprimare AWB (PDF)
- Anulare AWB

### 🧾 Facturare (SmartBill)
- Emitere facturi automat
- Facturi proforma
- Trimite facturi prin email
- Sincronizare plăți
- Export PDF

### 📧 Notificări Email
- Confirmare comandă
- Notificare expediere (cu AWB)
- Trimitere factură
- Alerte admin

### 🔐 Securitate
- Autentificare JWT
- Parole criptate (bcrypt)
- HTTPS obligatoriu în production
- Rate limiting API
- Validare input (Zod)

### 📊 Dashboard
- Statistici vânzări
- Grafice comenzi
- Status expedieri
- Rapoarte facturi

---

## 💻 Cerințe Sistem

### Server Requirements:
- **Node.js** 18.17.0 sau mai nou
- **PostgreSQL** 14 sau mai nou
- **RAM:** Minim 2GB (recomandat 4GB)
- **Storage:** Minim 10GB
- **OS:** Linux (Ubuntu 22.04/24.04), Windows Server, macOS

### API Keys Necesare:
1. **WooCommerce** - Consumer Key & Secret
2. **Cargus** - Username, Password, Client ID
3. **SmartBill** - API Token
4. **SendGrid** - API Key (pentru email)

---

## 🔧 Instalare

### 1. Clonează Repository-ul

```bash
# Descarcă proiectul
cd /var/www
unzip woomate.zip
cd woomate

# SAU dacă folosești Git
git clone https://your-repo/woomate.git
cd woomate
```

### 2. Instalează Dependențele

```bash
# Instalează pachetele Node.js
npm install

# SAU cu pnpm (recomandat, mai rapid)
pnpm install
```

### 3. Configurează PostgreSQL

```bash
# Conectează-te la PostgreSQL
sudo -u postgres psql

# Creează database și user
CREATE DATABASE woomate;
CREATE USER woomate WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE woomate TO woomate;

# Pentru PostgreSQL 15+
\c woomate
GRANT ALL ON SCHEMA public TO woomate;

\q
```

### 4. Configurează Environment Variables

```bash
# Copiază fișierul .env.example
cp .env.example .env

# Editează .env cu valorile tale
nano .env
```

**Variabile OBLIGATORII:**

```env
# Database
DATABASE_URL="postgresql://woomate:password@localhost:5432/woomate?schema=public"

# JWT (Generează cu: openssl rand -base64 64)
JWT_SECRET="your-super-long-secret-min-64-chars"

# Application
NEXT_PUBLIC_APP_URL="https://woomate.yourdomain.com"
NODE_ENV="production"

# Cargus API
CARGUS_USERNAME="your_username"
CARGUS_PASSWORD="your_password"
CARGUS_CLIENT_ID="your_client_id"

# SmartBill API
SMARTBILL_TOKEN="your_api_token"
SMARTBILL_EMAIL="your@email.com"
SMARTBILL_CIF="RO12345678"
SMARTBILL_COMPANY_NAME="Your Company SRL"

# SendGrid
SENDGRID_API_KEY="SG.xxxxx"
FROM_EMAIL="noreply@yourdomain.com"
```

### 5. Inițializează Database

```bash
# Generează Prisma Client
npx prisma generate

# Rulează migrațiile
npx prisma migrate deploy

# (Opțional) Populează cu date demo
npm run db:seed
```

### 6. Build Application

```bash
# Build pentru production
npm run build
```

### 7. Start Application

```bash
# Production mode
npm start

# SAU cu PM2 (recomandat pentru production)
npm install -g pm2
pm2 start npm --name "woomate" -- start
pm2 save
pm2 startup
```

---

## ⚙️ Configurare

### Accesează Dashboard-ul

1. Deschide browser la: `http://localhost:3000` (sau domeniul tău)
2. Login cu credențialele default:
   - **Email:** `admin@woomate.com`
   - **Password:** `ChangeThisPassword123!`
3. **SCHIMBĂ IMEDIAT PAROLA!**

### Adaugă Un Magazin (Tenant)

1. Mergi la **Settings** → **Tenants**
2. Click **Add New Tenant**
3. Completează:
   - **Nume magazin**
   - **WooCommerce URL** (ex: https://magazin.ro)
   - **Consumer Key** (din WooCommerce → Settings → Advanced → REST API)
   - **Consumer Secret**
   - **Webhook Secret** (opțional, pentru securitate)

### Configurează Webhooks în WooCommerce

Pentru sincronizare automată:

1. **WooCommerce** → **Settings** → **Advanced** → **Webhooks**
2. **Add Webhook:**
   - **Name:** WooMate Order Created
   - **Status:** Active
   - **Topic:** Order created
   - **Delivery URL:** `https://your-domain.com/api/webhooks/woocommerce?tenantId=YOUR_TENANT_ID`
   - **Secret:** (același din .env WEBHOOK_SECRET)
   - **API Version:** WP REST API v3

3. Creează webhook similar pentru **Order updated**

---

## 🚀 Deployment

### Opțiunea 1: VPS (Ubuntu 22.04/24.04)

#### 1. Pregătește Serverul

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Instalează Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalează PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalează PM2 global
sudo npm install -g pm2

# Instalează Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### 2. Configurează Nginx

```bash
# Creează configurație Nginx
sudo nano /etc/nginx/sites-available/woomate
```

Adaugă:

```nginx
server {
    listen 80;
    server_name woomate.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Activează site-ul
sudo ln -s /etc/nginx/sites-available/woomate /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obține SSL cu Let's Encrypt
sudo certbot --nginx -d woomate.yourdomain.com
```

#### 3. Deploy Aplicația

```bash
# Clone/upload project la /var/www/woomate
cd /var/www/woomate

# Instalează dependențe
npm ci --production

# Setup database și build
npx prisma generate
npx prisma migrate deploy
npm run build

# Start cu PM2
pm2 start npm --name "woomate" -- start
pm2 save
pm2 startup

# Monitoring
pm2 monit
```

### Opțiunea 2: Docker

```bash
# Build imagine
docker build -t woomate:latest .

# Run container
docker run -d \
  --name woomate \
  -p 3000:3000 \
  --env-file .env \
  woomate:latest
```

### Opțiunea 3: Shared Hosting (cPanel)

**Nu recomandat!** WooMate necesită Node.js și PostgreSQL. Majoritatea shared hosting-urilor nu le suportă.

Alternativă: Deploy pe **Railway**, **Render**, sau **DigitalOcean App Platform** (vezi ghidurile lor).

---

## 🔌 Integrări API

### 🚚 Cargus API

**Documentație:** https://urgent-cargus.docs.apiary.io/

**Obține Credențiale:**
1. Cont Cargus → https://www.cargus.ro/
2. Solicită acces API la suport@cargus.ro
3. Primești: Username, Password, Client ID

**Testare Conexiune:**
```bash
curl -X POST https://urgentcargus.azure-api.net/api/LoginUser \
  -H "Content-Type: application/json" \
  -d '{"UserName":"your_user","Password":"your_pass"}'
```

### 💰 SmartBill API

**Documentație:** https://www.smartbill.ro/api/docs/

**Obține API Token:**
1. SmartBill → Settings → Integrări → API
2. Generează API Token
3. Notează Email-ul contului

**Testare Conexiune:**
```bash
curl -X GET https://ws.smartbill.ro/SBORO/api/company \
  -u "email@company.com:your_api_token"
```

### 🛒 WooCommerce REST API

**Documentație:** https://woocommerce.github.io/woocommerce-rest-api-docs/

**Generează API Keys:**
1. WooCommerce → Settings → Advanced → REST API
2. Add Key
3. Description: WooMate
4. User: Admin
5. Permissions: Read/Write
6. Generate API Key
7. Salvează Consumer Key și Consumer Secret

**Testare Conexiune:**
```bash
curl https://your-store.com/wp-json/wc/v3/orders \
  -u "consumer_key:consumer_secret"
```

### 📧 SendGrid API

**Obține API Key:**
1. SendGrid → https://sendgrid.com/
2. Settings → API Keys → Create API Key
3. Restricted Access → Full Access (Mail Send)

**Testare Conexiune:**
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations":[{"to":[{"email":"test@test.com"}]}],
    "from":{"email":"from@yourdomain.com"},
    "subject":"Test",
    "content":[{"type":"text/plain","value":"Test"}]
  }'
```

---

## 📁 Structura Proiectului

```
woomate/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Date seed
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication
│   │   │   ├── orders/       # Orders management
│   │   │   ├── shipments/    # Shipments (Cargus)
│   │   │   ├── invoices/     # Invoices (SmartBill)
│   │   │   └── webhooks/     # WooCommerce webhooks
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── login/            # Login page
│   │   └── layout.tsx        # Root layout
│   ├── components/           # React components
│   │   ├── ui/              # shadcn/ui components
│   │   └── dashboard/       # Dashboard components
│   └── lib/                  # Core libraries
│       ├── auth.ts           # JWT authentication
│       ├── db.ts             # Prisma client
│       ├── cargus.ts         # Cargus API client
│       ├── smartbill.ts      # SmartBill API client
│       ├── woocommerce.ts    # WooCommerce API client
│       └── email.ts          # SendGrid email service
├── .env.example              # Environment variables template
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript configuration
```

---

## 🐛 Troubleshooting

### Aplicația nu pornește

**Eroare:** `Error: JWT_SECRET environment variable is required`

**Soluție:**
```bash
# Generează JWT_SECRET
openssl rand -base64 64

# Adaugă în .env
JWT_SECRET="generated_secret_here"
```

---

**Eroare:** `Can't reach database server at localhost:5432`

**Soluție:**
```bash
# Verifică dacă PostgreSQL rulează
sudo systemctl status postgresql

# Verifică DATABASE_URL în .env
# Format corect: postgresql://USER:PASSWORD@HOST:5432/DATABASE
```

---

### Comenzile nu se sincronizează

**Verificări:**

1. **Testează conexiunea WooCommerce:**
```bash
curl https://your-store.com/wp-json/wc/v3/orders \
  -u "consumer_key:consumer_secret"
```

2. **Verifică webhook-urile în WooCommerce:**
   - WooCommerce → Settings → Advanced → Webhooks
   - Verifică Delivery URL
   - Verifică Recent Deliveries (trebuie să fie verde)

3. **Verifică logs:**
```bash
pm2 logs woomate
```

---

### AWB-uri nu se generează

**Verificări:**

1. **Testează Cargus API:**
```typescript
// În terminal Node.js
const { createCargusClient } = require('./src/lib/cargus')
const client = createCargusClient()
await client.authenticate() // Trebuie să returneze token
```

2. **Verifică credențiale Cargus în .env**

3. **Verifică adresa de livrare:**
   - Orașul trebuie să existe în baza Cargus
   - Județul trebuie să fie valid

---

### Email-uri nu se trimit

**Verificări:**

1. **Testează SendGrid API Key:**
```bash
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@test.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'
```

2. **Verifică FROM_EMAIL:**
   - Trebuie să fie un domeniu verificat în SendGrid
   - Sau adaugă Single Sender Verification

---

### Build-ul eșuează

**Eroare:** `Type error: Cannot find module '@/lib/db'`

**Soluție:**
```bash
# Verifică paths în tsconfig.json
# Trebuie: "@/*": ["./src/*"]

# Regenerează Prisma Client
npx prisma generate

# Rebuild
npm run build
```

---

## 📞 Suport

### Documentație Oficială:
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Cargus API:** https://urgent-cargus.docs.apiary.io/
- **SmartBill API:** https://www.smartbill.ro/api/docs/
- **WooCommerce API:** https://woocommerce.github.io/woocommerce-rest-api-docs/

### Debugging:

```bash
# Logs aplicație
pm2 logs woomate

# Logs Nginx
sudo tail -f /var/log/nginx/error.log

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Database GUI
npx prisma studio
# Deschide la: http://localhost:5555
```

---

## 📝 Licență

Acest proiect este proprietate privată. Toate drepturile rezervate.

---

## 🎉 Succes!

WooMate este acum configurat și funcțional! 

**Next Steps:**
1. ✅ Schimbă parola admin
2. ✅ Adaugă primul tenant
3. ✅ Configurează webhook-urile WooCommerce
4. ✅ Testează un flow complet de comandă
5. ✅ Setup backup database (pg_dump)

**Monitorizare:**
```bash
pm2 monit              # Real-time monitoring
pm2 status             # Status aplicații
htop                   # Server resources
```

Mult succes! 🚀
