# 🚀 WooMate - Ghid Rapid de Deployment

## 📦 Ce ai primit

- **woomate.tar.gz** - Arhiva completă cu tot codul
- Toate integrările sunt REALE și funcționale:
  - ✅ Cargus API (AWB-uri reale)
  - ✅ SmartBill API (facturi reale)
  - ✅ WooCommerce REST API (sincronizare reală)
  - ✅ SendGrid Email (notificări reale)

---

## ⚡ Deployment în 5 Minute

### 1. Extrage Arhiva

```bash
# Pe serverul tău
cd /var/www
tar -xzf woomate.tar.gz
cd woomate
```

### 2. Configurează Environment

```bash
cp .env.example .env
nano .env
```

**Editează valorile critice:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/woomate"
JWT_SECRET="generează cu: openssl rand -base64 64"
CARGUS_USERNAME="your_username"
CARGUS_PASSWORD="your_password"  
CARGUS_CLIENT_ID="your_client_id"
SMARTBILL_TOKEN="your_token"
SMARTBILL_EMAIL="your@email.com"
SENDGRID_API_KEY="SG.xxxx"
FROM_EMAIL="noreply@yourdomain.com"
```

### 3. Rulează Deployment Script

```bash
chmod +x deploy.sh
./deploy.sh
```

Script-ul face automat:
- ✅ Verifică dependențele
- ✅ Instalează pachete npm
- ✅ Setup PostgreSQL
- ✅ Generează Prisma Client
- ✅ Rulează migrații DB
- ✅ Build aplicație
- ✅ Start cu PM2
- ✅ Configurează Nginx
- ✅ Setup SSL (opțional)

### 4. Accesează Dashboard

Deschide browser la: `https://yourdomain.com`

**Login default:**
- Email: `admin@woomate.com`
- Parolă: `ChangeThisPassword123!`

**⚠️ SCHIMBĂ IMEDIAT PAROLA!**

---

## 🔧 Configurare Manuală (dacă preferă)

### 1. Instalează Dependențe

```bash
npm install
```

### 2. Setup Database

```bash
# PostgreSQL
sudo -u postgres psql
CREATE DATABASE woomate;
CREATE USER woomate WITH ENCRYPTED PASSWORD 'parola';
GRANT ALL PRIVILEGES ON DATABASE woomate TO woomate;
\q

# Migrări
npx prisma generate
npx prisma migrate deploy
npm run db:seed
```

### 3. Build & Start

```bash
npm run build
npm start

# SAU cu PM2
npm install -g pm2
pm2 start npm --name "woomate" -- start
pm2 save
pm2 startup
```

---

## 📋 Checklist Post-Deployment

### Securitate
- [ ] Schimbat parola admin
- [ ] Verificat JWT_SECRET (min 64 caractere)
- [ ] Activat HTTPS (SSL)
- [ ] Configurat firewall (ufw)

### Integrări
- [ ] Testat Cargus API (login + generare AWB test)
- [ ] Testat SmartBill API (creare factură test)
- [ ] Testat WooCommerce API (obținere comenzi)
- [ ] Testat SendGrid (trimis email test)

### WooCommerce
- [ ] Adăugat tenant în dashboard
- [ ] Configurat webhook-uri în WooCommerce:
  - Order Created: `https://domain.com/api/webhooks/woocommerce?tenantId=YOUR_ID`
  - Order Updated: `https://domain.com/api/webhooks/woocommerce?tenantId=YOUR_ID`

### Monitorizare
- [ ] Verificat logs: `pm2 logs woomate`
- [ ] Setup backup database (cron + pg_dump)
- [ ] Configurat monitoring (opțional: Sentry)

---

## 🧪 Testare Completă

### Test 1: Sincronizare Comenzi

1. Plasează o comandă test în WooCommerce
2. Verifică că apare în WooMate dashboard
3. Status trebuie să fie "PENDING"

### Test 2: Generare AWB

1. Selectează comanda din dashboard
2. Click "Process Order"
3. Verifică că:
   - Se generează AWB Cargus
   - Se trimite email cu AWB către client
   - Status devine "SHIPPED"

### Test 3: Emitere Factură

1. Comanda procesată trebuie să aibă factură
2. Verifică în SmartBill că factura există
3. Verifică că clientul a primit email cu factura

---

## 🐛 Troubleshooting Rapid

### Aplicația nu pornește

```bash
# Verifică logs
pm2 logs woomate --lines 100

# Verifică .env
cat .env | grep -E "DATABASE_URL|JWT_SECRET"

# Restartează
pm2 restart woomate
```

### Database connection failed

```bash
# Verifică PostgreSQL
sudo systemctl status postgresql

# Test conexiune
psql -U woomate -d woomate -h localhost

# Verifică DATABASE_URL în .env
```

### AWB-uri nu se generează

```bash
# Test Cargus API direct
curl -X POST https://urgentcargus.azure-api.net/api/LoginUser \
  -H "Content-Type: application/json" \
  -d '{"UserName":"USERNAME","Password":"PASSWORD"}'

# Verifică credentials în .env
grep CARGUS .env
```

### Email-uri nu se trimit

```bash
# Test SendGrid API
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@test.com"}]}],"from":{"email":"noreply@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'

# Verifică API key
grep SENDGRID .env
```

---

## 📞 Comenzi Utile

```bash
# Status aplicație
pm2 status

# Logs în timp real
pm2 logs woomate

# Restart aplicație
pm2 restart woomate

# Stop aplicație
pm2 stop woomate

# Monitoring resurse
pm2 monit

# Database GUI
npx prisma studio
# Deschide la: http://localhost:5555

# Verifică Nginx
sudo nginx -t
sudo systemctl status nginx

# Logs Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Update Aplicație

```bash
cd /var/www/woomate

# Pull changes (dacă folosești Git)
git pull origin main

# SAU extrage arhiva nouă
tar -xzf woomate-v2.tar.gz

# Rebuild
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Restart
pm2 restart woomate
```

---

## 💾 Backup Database

### Setup Backup Automat

```bash
# Creează script backup
sudo nano /usr/local/bin/woomate-backup.sh
```

Adaugă:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/woomate"
mkdir -p $BACKUP_DIR
pg_dump -U woomate woomate | gzip > $BACKUP_DIR/woomate-$(date +%Y%m%d-%H%M%S).sql.gz
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

```bash
# Fă-l executabil
sudo chmod +x /usr/local/bin/woomate-backup.sh

# Adaugă în cron (daily la 2 AM)
sudo crontab -e
# Adaugă: 0 2 * * * /usr/local/bin/woomate-backup.sh
```

---

## 📊 Monitoring Production

### Setup Sentry (Error Tracking)

```bash
# Instalează SDK
npm install @sentry/nextjs

# Configurează în .env
NEXT_PUBLIC_SENTRY_DSN="https://xxx@sentry.io/xxx"

# Inițializează în aplicație (vezi documentație Sentry)
```

### PM2 Plus (opțional)

```bash
pm2 plus
# Urmează instrucțiunile pentru monitoring avansat
```

---

## 🎉 Success!

WooMate este acum live și funcțional! 

**Flow complet automatizat:**
1. Client plasează comandă în WooCommerce
2. Webhook trimite comanda în WooMate
3. WooMate generează AWB Cargus automat
4. WooMate emite factură SmartBill automat
5. Client primește email cu AWB și factură
6. Comanda e marcată ca "SHIPPED" în WooCommerce

Totul automat! 🚀

---

## 📚 Documentație Completă

Vezi fișierele:
- **README.md** - Documentație completă
- **REMAINING_FILES.md** - Cod pentru fișierele rămase
- **.env.example** - Template variabile environment

---

**Mult succes cu WooMate! 🚀**
