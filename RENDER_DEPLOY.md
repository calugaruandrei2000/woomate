# WooMate - Deployment Guide pentru Render

## 🚀 Quick Start pe Render

### Opțiunea 1: Deploy Automat cu Blueprint (Recomandat)

1. **Fork sau push repo pe GitHub**
2. **Mergi pe [Render Dashboard](https://dashboard.render.com)**
3. **New → Blueprint**
4. **Conectează repo-ul tău**
5. **Render va detecta `render.yaml` și va crea automat:**
   - Web Service (Node.js)
   - PostgreSQL Database
   - Toate environment variables

### Opțiunea 2: Deploy Manual

#### Pasul 1: Creează PostgreSQL Database

1. În Render Dashboard: **New → PostgreSQL**
2. Nume: `woomate-db`
3. Region: **Frankfurt** (pentru Europa)
4. Plan: **Starter** (gratuit)
5. Copiază **Internal Database URL**

#### Pasul 2: Creează Web Service

1. În Render Dashboard: **New → Web Service**
2. Conectează repo-ul GitHub
3. Configurații:
   - **Name:** `woomate`
   - **Region:** Frankfurt
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `./build.sh`
   - **Start Command:** `npm start`

#### Pasul 3: Environment Variables

Adaugă în web service:

```
DATABASE_URL=<internal-database-url-from-step-1>
SESSION_SECRET=<generate-random-64-chars>
DEFAULT_ADMIN_EMAIL=admin@woomate.com
DEFAULT_ADMIN_PASSWORD=<your-secure-password>
DEFAULT_ADMIN_NAME=Admin User
ENABLE_EMAIL_NOTIFICATIONS=false
NODE_ENV=production
```

**Important:** 
- Pentru `SESSION_SECRET`, folosește: `openssl rand -hex 32`
- Pentru `DEFAULT_ADMIN_PASSWORD`, folosește o parolă puternică

#### Pasul 4: Deploy

1. Click **Create Web Service**
2. Render va:
   - Instala dependențele
   - Genera Prisma Client
   - Rula migrațiile
   - Seed database-ul
   - Build Next.js
   - Start aplicația

## 📋 Post-Deployment

### 1. Verifică Health Check

```bash
curl https://your-app.onrender.com/api/health
```

Răspuns așteptat:
```json
{
  "status": "ok",
  "timestamp": "2025-01-29T12:00:00.000Z",
  "database": "connected"
}
```

### 2. Login în Aplicație

1. Mergi la: `https://your-app.onrender.com`
2. Login cu:
   - Email: `admin@woomate.com` (sau ce ai setat)
   - Parolă: din `DEFAULT_ADMIN_PASSWORD`

### 3. Configurează Tenants

Din dashboard, adaugă tenant-uri WooCommerce cu credențiale pentru:
- **WooCommerce API:** Consumer Key & Secret
- **Cargus:** Username, Password, Client ID
- **SmartBill:** API Token, Email

### 4. Configurează Webhook-uri WooCommerce

În WooCommerce → Settings → Advanced → Webhooks:

**Order Created:**
- URL: `https://your-app.onrender.com/api/webhooks/woocommerce?tenantId=YOUR_TENANT_ID`
- Topic: `Order created`
- Secret: (opțional, salvează în tenant)

**Order Updated:**
- URL: `https://your-app.onrender.com/api/webhooks/woocommerce?tenantId=YOUR_TENANT_ID`
- Topic: `Order updated`

## 🔧 Configurații Opționale

### Email Notifications (SendGrid)

Pentru notificări email:

1. Creează cont [SendGrid](https://sendgrid.com)
2. Generează API Key
3. Adaugă în Environment Variables:
   ```
   SENDGRID_API_KEY=your-key
   EMAIL_FROM=noreply@yourdomain.com
   EMAIL_FROM_NAME=WooMate
   ENABLE_EMAIL_NOTIFICATIONS=true
   ```

### SmartBill Company Info

Pentru facturare:

```
SMARTBILL_CIF=RO12345678
SMARTBILL_COMPANY_NAME=Company SRL
SMARTBILL_REG_COM=J40/1234/2020
SMARTBILL_ADDRESS=Str. Exemplu nr. 1
SMARTBILL_IBAN=RO49AAAA1B31007593840000
SMARTBILL_BANK=Banca Transilvania
```

## 🔄 Updates & Redeploy

### Auto-Deploy (Recomandat)

1. Push schimbări pe GitHub
2. Render va detecta și va redeploy automat

### Manual Deploy

În Render Dashboard:
1. Selectează service-ul
2. **Manual Deploy → Deploy latest commit**

## 📊 Monitoring

### Logs

În Render Dashboard → Service → Logs

### Database

În Render Dashboard → Database → Info
- Connection String
- External Connection (pentru acces din local)

### Metrics

Render oferă gratuit:
- CPU usage
- Memory usage
- Response times
- Error rates

## 🛡️ Securitate

### Best Practices

1. **Schimbă parolele default** după primul login
2. **Folosește HTTPS** (oferit gratuit de Render)
3. **Webhook secrets** pentru validare semnături
4. **Rate limiting** pentru API-uri publice
5. **Backup database** regulat (din Render Dashboard)

### Database Backups

Render oferă backup automat:
- Retention: 7 zile (Starter plan)
- Manual backup: Dashboard → Database → Backups

## 🐛 Troubleshooting

### Build Fails

```bash
# Verifică logs în Render Dashboard
# Cele mai comune probleme:

# 1. Lipsă dependențe
npm ci

# 2. Prisma migration fail
npx prisma migrate deploy --force

# 3. Build timeout
# Crește timeout în Render settings
```

### Database Connection Error

```bash
# Verifică DATABASE_URL
# Trebuie să fie Internal Database URL, nu External

# Format corect:
postgresql://user:pass@host:5432/db
```

### App Crashes

```bash
# Check logs pentru:
# - Environment variables lipsa
# - Port binding issues (Render setează automat PORT)
# - Database connection issues
```

## 💰 Pricing

### Free Tier (Starter)

**Web Service:**
- 750 ore/lună (suficient pentru 1 app)
- 512 MB RAM
- Auto-sleep după 15 min inactivitate
- Shared CPU

**Database:**
- 1 GB storage
- 7 zile backup retention

### Paid Plans

**Web Service (Starter: $7/lună):**
- Nu se suspendă
- 512 MB RAM
- 0.5 CPU

**Database (Starter: $7/lună):**
- 1 GB storage
- 14 zile retention

## 📚 Resources

- [Render Docs](https://render.com/docs)
- [Next.js on Render](https://render.com/docs/deploy-nextjs-app)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Environment Variables](https://render.com/docs/environment-variables)

## 🤝 Support

Pentru probleme:
1. Check [Render Status](https://status.render.com)
2. Render Community Forum
3. GitHub Issues

---

**Important:** Free tier web services se suspendează după 15 minute de inactivitate. Prima cerere după suspend va lua ~30 secunde pentru wake-up.
