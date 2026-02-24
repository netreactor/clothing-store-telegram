# DEPLOYMENT GUIDE - Telegram Mini App Clothing Store

## Prerequisites

1. **Telegram Bot Token**
   - Open Telegram and find @BotFather
   - Create a new bot: `/newbot`
   - Save your bot token (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

2. **Accounts**
   - Railway.app or Render.com account (for backend)
   - Vercel.com account (for frontend)
   - GitHub account (for deployment from repository)

---


## Telegram Mini App Safety Checklist

Before production launch, verify:

- Frontend uses `BrowserRouter` (not `HashRouter`).
- `window.Telegram.WebApp.ready()` is called in `frontend/index.html` `<head>` before React loads.
- Backend CORS allows Telegram WebView origins (`origin: true`).
- Helmet disables CSP/X-Frame options for API-only backend.
- Reverse proxy does **not** set `X-Frame-Options` for Mini App frontend.
- Reverse proxy `proxy_pass` port matches backend `PORT` (default `3001`).
- Re-authenticate with Telegram on each Mini App open to refresh role claims in JWT.
- For PM2 + ESM projects, use `ecosystem.config.cjs`.
- `setChatMenuButton` API calls include `chat_id` when setting per-user button.

Example:

```bash
curl -X POST "https://api.telegram.org/bot<token>/setChatMenuButton" \
  -H "Content-Type: application/json" \
  -d '{"chat_id":123456789,"menu_button":{"type":"web_app","text":"Открыть магазин","web_app":{"url":"https://your-app.vercel.app"}}}'
```

---

## PART 1: Backend Deployment (Railway)

### Step 1: Push Code to GitHub

```bash
# In your project root
git init
git add .
git commit -m "Initial commit - Telegram Mini App migration"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Select the `backend` folder as root directory

### Step 3: Configure Environment Variables

In Railway dashboard, go to Variables and add:

```env
PORT=3001
NODE_ENV=production
TELEGRAM_BOT_TOKEN=<your-bot-token-from-botfather>
JWT_SECRET=<generate-strong-32-char-random-string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=<will-add-after-frontend-deployment>
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Configure Build Settings

Railway should auto-detect, but verify:
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Root Directory:** `/backend`

### Step 5: Deploy

Click "Deploy" and wait for deployment to complete.

**Save your backend URL** (e.g., `https://your-app.up.railway.app`)

---

## PART 2: Frontend Deployment (Vercel)

### Step 1: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### Step 2: Configure Environment Variables

In Vercel dashboard, go to Settings → Environment Variables:

```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

Replace `your-backend.up.railway.app` with your actual Railway backend URL.

### Step 3: Deploy

Click "Deploy" and wait for deployment to complete.

**Save your frontend URL** (e.g., `https://your-app.vercel.app`)

### Step 4: Update Backend FRONTEND_URL

Go back to Railway → Variables and update:

```env
FRONTEND_URL=https://your-app.vercel.app
```

Redeploy the backend.

---

## PART 3: Configure Telegram Bot

### Step 1: Set Web App Domain

Open Telegram and message @BotFather:

```
/setdomain
→ Select your bot
→ Enter: your-app.vercel.app
```

### Step 2: Set Menu Button

```
/setmenubutton
→ Select your bot
→ Choose "Menu Button URL"
→ Button text: Открыть магазин
→ Web App URL: https://your-app.vercel.app
```

### Step 3: Set Bot Description

```
/setdescription
→ Select your bot
→ Каталог одежды прямо в Telegram! Просматривайте товары, читайте новости и многое другое.
```

### Step 4: Test Your Bot

1. Open your bot in Telegram
2. Click "Menu" button or type any message
3. Your web app should open in Telegram
4. You should be automatically authenticated

---

## PART 4: Promote First Admin

By default, all Telegram users have the `user` role. To promote yourself to `master_admin`:

### Option A: Direct Database Access (Railway)

1. Railway Dashboard → Your project → "PostgreSQL" (or use SQLite viewer)
2. Connect to database
3. Run SQL:

```sql
-- Find your Telegram user ID
SELECT * FROM telegram_users ORDER BY created_at DESC LIMIT 5;

-- Promote yourself to master_admin
UPDATE telegram_users SET role = 'master_admin' WHERE telegram_id = 'YOUR_TELEGRAM_ID';
```

Replace `YOUR_TELEGRAM_ID` with your actual ID from the first query.

### Option B: Add API Endpoint (Temporary)

Add this to `backend/server.js` (REMOVE AFTER USE):

```javascript
// TEMPORARY - Remove after promoting first admin
app.post('/api/admin/promote', (req, res) => {
  const { telegramId, secretCode } = req.body;
  
  if (secretCode !== 'YOUR_SECRET_PROMOTION_CODE') {
    return res.status(403).json({ error: 'Invalid secret code' });
  }
  
  db.prepare('UPDATE telegram_users SET role = ? WHERE telegram_id = ?')
    .run('master_admin', telegramId);
  
  res.json({ success: true });
});
```

Then call via Postman or curl:

```bash
curl -X POST https://your-backend.up.railway.app/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{"telegramId":"YOUR_TELEGRAM_ID","secretCode":"YOUR_SECRET_PROMOTION_CODE"}'
```

**IMPORTANT:** Delete this endpoint after promoting yourself!

---

## PART 5: Database Backup

### Railway PostgreSQL Backup

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Backup database
railway run sqlite3 backend/database.sqlite ".backup backup.sqlite"

# Download backup
railway download backup.sqlite
```

### Automated Backup (Cron Job)

Add to `backend/package.json`:

```json
{
  "scripts": {
    "backup": "node backup.js"
  }
}
```

Create `backend/backup.js`:

```javascript
import Database from 'better-sqlite3';
import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

try {
  copyFileSync(
    join(__dirname, 'database.sqlite'),
    join(__dirname, `backups/database-${timestamp}.sqlite`)
  );
  console.log(`✅ Backup created: database-${timestamp}.sqlite`);
} catch (error) {
  console.error('❌ Backup failed:', error);
}
```

Create `backend/backups` directory and add to `.gitignore`.

---

## PART 6: Monitoring & Logging

### Railway Logs

View real-time logs in Railway dashboard:
- Click on your service
- Go to "Deployments" → Select latest deployment
- Click "View Logs"

### Error Monitoring

Consider adding Sentry:

```bash
npm install @sentry/node
```

In `server.js`:

```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

app.use(Sentry.Handlers.errorHandler());
```

---

## PART 7: Scaling & Performance

### Database Optimization

For SQLite in production:

```javascript
// In server.js
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000');
```

### Consider PostgreSQL for Scale

If you exceed 10,000 users, migrate to PostgreSQL:

1. Railway → "New" → "Database" → "PostgreSQL"
2. Install `pg` instead of `better-sqlite3`
3. Update queries to use `$1`, `$2` placeholders

---

## PART 8: Troubleshooting

### Issue: "Telegram WebApp SDK not loaded"

**Solution:** Ensure `index.html` has:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### Issue: "CORS error"

**Solution:** Check `FRONTEND_URL` in Railway environment variables matches your Vercel domain exactly.

### Issue: "Invalid authentication hash"

**Solution:** Verify `TELEGRAM_BOT_TOKEN` is correct in Railway environment variables.

### Issue: "Database locked"

**Solution:** Ensure WAL mode is enabled:
```javascript
db.pragma('journal_mode = WAL');
```

### Issue: "Can't access admin panel"

**Solution:** 
1. Check your role in database: `SELECT role FROM telegram_users WHERE telegram_id = 'YOUR_ID';`
2. Promote yourself to `master_admin` if needed

---

## PART 9: Security Checklist

- [ ] `JWT_SECRET` is strong (32+ random characters)
- [ ] `NODE_ENV=production` is set
- [ ] No default admin credentials in production
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] Rate limiting configured
- [ ] CORS restricted to your frontend domain only
- [ ] Database backups automated
- [ ] Error logging configured (Sentry/Railway logs)
- [ ] Admin promotion endpoint removed
- [ ] `.env` files not committed to Git

---

## PART 10: Testing

### Local Testing

```bash
# Terminal 1 - Backend
cd backend
npm install
npm start

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

### Production Testing

1. Open bot in Telegram on mobile
2. Click menu button
3. Verify app loads
4. Test authentication
5. Test admin panel access (if you're admin)
6. Test all CRUD operations
7. Test search functionality
8. Test theme toggle

---

## Support & Maintenance

### Daily Tasks
- Check Railway logs for errors
- Monitor database size

### Weekly Tasks
- Review error rates in logs
- Check database backups exist

### Monthly Tasks
- Update dependencies: `npm update`
- Review security patches
- Test full user flow

---

## Success Metrics

Your deployment is successful when:
- ✅ Bot opens app in Telegram
- ✅ Users are auto-authenticated
- ✅ All products load correctly
- ✅ Search works
- ✅ Admin panel accessible to admins
- ✅ CRUD operations work
- ✅ No CORS errors
- ✅ No authentication errors
- ✅ Database persists data
- ✅ Backups are automated

---

## Next Steps

1. Add more products via admin panel
2. Invite beta testers
3. Monitor feedback
4. Iterate based on user needs
5. Scale as needed

**Congratulations! Your Telegram Mini App is live! 🎉**
