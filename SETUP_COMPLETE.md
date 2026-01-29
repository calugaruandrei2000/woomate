# 🎯 WooMate MVP - Complet și Gata de Deploy

## ✅ Ce Este Inclus

### Backend Complet
- ✅ Autentificare cu JWT (Jose)
- ✅ API pentru Orders, Shipments, Invoices, Tenants
- ✅ Webhook WooCommerce pentru comenzi noi
- ✅ Integrare Cargus (generare AWB)
- ✅ Integrare SmartBill (facturare)
- ✅ Sistem de email (SendGrid)
- ✅ Database cu Prisma (PostgreSQL)

### Frontend Funcțional
- ✅ Login page
- ✅ Dashboard simplu
- ✅ UI Components (shadcn/ui)
- ✅ Responsive design (Tailwind)

### DevOps Ready
- ✅ Dockerfile
- ✅ Docker Compose
- ✅ Render deployment config
- ✅ Health check endpoint
- ✅ Database migrations
- ✅ Seed script

## 🚀 Deployment Options

### Option 1: Render (Recomandat) ⭐

**Avantaje:**
- Gratuit pentru început (Starter tier)
- Setup în 5 minute
- PostgreSQL inclus
- SSL gratuit
- Git deploy automat

**Pași:**
1. Vezi `RENDER_DEPLOY.md` pentru instrucțiuni complete
2. Push pe GitHub
3. Connect în Render Dashboard
4. Deploy automat via `render.yaml`

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup database
docker-compose up -d

# 3. Configure .env
cp .env.example .env
# Edit .env cu credențialele tale

# 4. Run migrations
npm run db:migrate

# 5. Seed database
npm run db:seed

# 6. Start dev server
npm run dev
```

Acces: http://localhost:3000

## 🔑 Credențiale Inițiale

După seed, folosește:
- **Email:** admin@woomate.com
- **Parolă:** (ce ai setat în `DEFAULT_ADMIN_PASSWORD`)

## 📋 Environment Variables Necesare

### Obligatorii:
```env
DATABASE_URL=postgresql://...
SESSION_SECRET=random-64-chars
DEFAULT_ADMIN_EMAIL=admin@woomate.com
DEFAULT_ADMIN_PASSWORD=SecurePassword123!
```

### Opționale (activează features):
```env
# Email
SENDGRID_API_KEY=
EMAIL_FROM=
ENABLE_EMAIL_NOTIFICATIONS=true

# SmartBill
SMARTBILL_CIF=
SMARTBILL_COMPANY_NAME=
# ... vezi .env.example
```

## 🔗 API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session

### Orders
- `GET /api/orders` - Lista comenzi
- `GET /api/orders/:id` - Detalii comandă
- `POST /api/orders/:id/process` - Procesează (AWB + factură)

### Webhooks
- `POST /api/webhooks/woocommerce?tenantId=X` - Primește comenzi

### Health
- `GET /api/health` - Status check

## 🛠️ Configurare WooCommerce

### 1. Adaugă Tenant în Dashboard

După login, configurează:
- Nume store
- WooCommerce URL
- Consumer Key & Secret
- Cargus credentials
- SmartBill token

### 2. Setup Webhook în WooCommerce

Admin → Settings → Advanced → Webhooks

**Create Webhook:**
- URL: `https://your-app.com/api/webhooks/woocommerce?tenantId=YOUR_TENANT_ID`
- Topic: Order created
- Secret: (opțional)

## 🎨 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** PostgreSQL + Prisma
- **Auth:** Jose (JWT)
- **UI:** Tailwind + shadcn/ui
- **Validation:** Zod
- **Email:** SendGrid
- **Courier:** Cargus API
- **Invoicing:** SmartBill API

## 📚 Documentație

- `README.md` - Overview general
- `RENDER_DEPLOY.md` - Deploy pe Render
- `QUICK_START.md` - Quick start local
- `REMAINING_FILES.md` - Detalii implementare

## 🔄 Workflow Complet

1. **Client comandă în WooCommerce**
   ↓
2. **Webhook trimite date către WooMate**
   ↓
3. **WooMate salvează comanda în DB**
   ↓
4. **Admin procesează din dashboard**
   ↓
5. **Generare automată:**
   - AWB Cargus
   - Factură SmartBill
   - Email către client
   ↓
6. **Status update în WooCommerce**

## 💡 Next Steps După Deploy

1. ✅ Deploy pe Render
2. ✅ Login în aplicație
3. ✅ Adaugă primul tenant
4. ✅ Configurează webhook WooCommerce
5. ✅ Test cu o comandă reală
6. ✅ Monitorizează logs

## 🐛 Troubleshooting

### Build Fails
- Check Node version (>=18.17.0)
- Verifică DATABASE_URL
- Run `npm ci` fresh install

### Database Issues
- Verifică PostgreSQL e pornit
- Check connection string
- Run migrations: `npm run db:migrate`

### Auth Issues
- Verifică SESSION_SECRET e setat
- Check cookie settings
- Clear browser cache

## 📞 Support

Pentru probleme sau întrebări:
- Check documentation files
- Review logs în Render/Local
- Database inspect: `npm run db:studio`

---

**Status:** ✅ Production Ready
**Version:** 1.0.0
**Last Updated:** 2025-01-29

Succes cu WooMate! 🚀
