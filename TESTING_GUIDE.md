# TESTING GUIDE - Telegram Mini App

## 🧪 Test Coverage Overview

This guide covers testing for:
- ✅ Local development testing
- ✅ Telegram WebApp integration testing
- ✅ Authentication flows
- ✅ API endpoints
- ✅ Admin panel functionality
- ✅ Production deployment verification

---

## PHASE 1: Local Development Testing

### Prerequisites
```bash
# Ensure both servers are running
# Terminal 1
cd backend && npm start

# Terminal 2
cd frontend && npm run dev
```

### Test 1: Backend API Health Check

**Endpoint:** `GET http://localhost:3001/api/categories`

**Expected Result:**
```json
[
  {
    "id": 1,
    "name": "Мужская одежда",
    "icon": "shirt",
    "created_at": "..."
  },
  ...
]
```

**Test via:**
```bash
curl http://localhost:3001/api/categories
```

### Test 2: Products Search

**Endpoint:** `GET http://localhost:3001/api/products?search=футболка`

**Expected Result:** Products containing "футболка" in name, description, or article

```bash
curl "http://localhost:3001/api/products?search=футболка"
```

### Test 3: Frontend Loading

**URL:** `http://localhost:5173`

**Expected:**
- ✅ Homepage loads
- ✅ Categories visible
- ✅ Products visible
- ✅ Search bar functional
- ✅ Theme toggle works
- ✅ No console errors

### Test 4: Admin Panel Access (Non-Telegram)

**URL:** `http://localhost:5173/#/admin`

**Expected:**
- ✅ Login form appears
- ✅ "Use password login" option visible (dev mode only)
- ✅ Can enter username/password
- ✅ Error shown for invalid credentials

**Test Credentials (dev mode):**
- Username: `admin`
- Password: `admin`

---

## PHASE 2: Authentication Testing

### Test 5: Password Authentication (Development)

1. Navigate to `http://localhost:5173/#/admin`
2. Click "Use password login"
3. Enter:
   - Username: `admin`
   - Password: `admin`
4. Click "Войти"

**Expected:**
- ✅ JWT token stored in localStorage
- ✅ Redirect to admin panel
- ✅ User info displayed
- ✅ No errors in console

**Verify:**
```javascript
// In browser console
localStorage.getItem('telegram_auth_token')
localStorage.getItem('telegram_auth_user')
```

### Test 6: Token Validation

**Endpoint:** `GET http://localhost:3001/api/auth/me`

**Test:**
```bash
# Get token from localStorage first
TOKEN="<your-jwt-token>"

curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Expected:**
```json
{
  "id": 1,
  "username": "admin",
  "role": "master_admin",
  ...
}
```

### Test 7: Protected Endpoint Access

**Endpoint:** `POST http://localhost:3001/api/products` (admin only)

**Test WITHOUT token:**
```bash
curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","article":"TEST-001","subcategory_id":1}'
```

**Expected:** `401 Unauthorized`

**Test WITH token:**
```bash
TOKEN="<your-jwt-token>"

curl -X POST http://localhost:3001/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Test Product","article":"TEST-001","subcategory_id":1}'
```

**Expected:** Product created successfully

---

## PHASE 3: Telegram WebApp Testing (Local)

### Prerequisites: Setup ngrok

```bash
# Install ngrok
npm install -g ngrok

# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Expose backend
ngrok http 3001
# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)

# Terminal 3: Update frontend .env
echo "VITE_API_URL=https://abc123.ngrok.io/api" > frontend/.env

# Terminal 4: Run frontend
cd frontend && npm run dev

# Terminal 5: Expose frontend
ngrok http 5173
# Copy the HTTPS URL (e.g., https://def456.ngrok.io)
```

### Test 8: Configure Telegram Bot

1. Open Telegram
2. Find @BotFather
3. Send: `/setdomain`
4. Select your bot
5. Enter: `def456.ngrok.io` (your ngrok frontend URL without https://)
6. Send: `/setmenubutton`
7. Select your bot
8. Choose "Menu Button URL"
9. Button text: `Open Store`
10. Web App URL: `https://def456.ngrok.io`

### Test 9: Open in Telegram

1. Open your bot in Telegram (mobile app recommended)
2. Click the "Menu" button or send any message
3. Web app should open

**Expected:**
- ✅ App loads in Telegram interface
- ✅ Telegram theme colors applied
- ✅ No horizontal scroll
- ✅ Full screen height used
- ✅ Products load correctly

### Test 10: Telegram Authentication

**Check browser console in Telegram Desktop (F12):**

**Expected logs:**
```
✅ Telegram WebApp SDK loaded
✅ Telegram WebApp initialized: {version: "...", platform: "...", user: {...}}
✅ Telegram authentication successful: {id: ..., role: "user", ...}
```

**Verify in backend logs:**
```
Telegram auth successful for user ID: 123456789
User created/updated in database
JWT token issued
```

### Test 11: Auto-Authentication Flow

1. Close and reopen the bot
2. App should open immediately without login
3. Token should be reused from localStorage

**Check:**
```javascript
// In Telegram WebApp console
localStorage.getItem('telegram_auth_token')
// Should have a valid token
```

---

## PHASE 4: Admin Panel Functionality

### Test 12: Admin Access Control

**Scenario 1: Regular user (role = 'user')**
1. Authenticate via Telegram
2. Navigate to admin page
3. Expected: "Access Denied" message with role displayed

**Scenario 2: Admin user (role = 'admin')**
1. Promote user to admin (see Test 13)
2. Navigate to admin page
3. Expected: Admin panel loads, all tabs except "Administrators" visible

**Scenario 3: Master admin (role = 'master_admin')**
1. Promote user to master_admin
2. Navigate to admin page
3. Expected: Admin panel loads, all tabs including "Administrators" visible

### Test 13: Promote User to Admin

```sql
-- Connect to database (Railway CLI, SQLite browser, etc.)
-- Find your Telegram user
SELECT * FROM telegram_users ORDER BY created_at DESC LIMIT 5;

-- Promote to admin
UPDATE telegram_users SET role = 'admin' WHERE telegram_id = 'YOUR_TELEGRAM_ID';

-- Or promote to master_admin
UPDATE telegram_users SET role = 'master_admin' WHERE telegram_id = 'YOUR_TELEGRAM_ID';
```

**Verify:**
1. Refresh admin panel
2. Should now have access
3. Check badge shows correct role

### Test 14: Posts Management

**Create Post:**
1. Navigate to "Посты" tab
2. Click "Добавить пост"
3. Enter:
   - Title: "Test Post"
   - Content: Rich text with formatting
   - Image URL: (optional)
4. Click "Добавить пост"

**Expected:**
- ✅ Post appears in list
- ✅ Author name shows your Telegram name
- ✅ Created date is current
- ✅ No errors

**Edit Post:**
1. Click "Edit" on a post
2. Modify content
3. Save changes

**Expected:**
- ✅ Changes saved
- ✅ Post updated in list

**Delete Post:**
1. Click "Delete" on a post
2. Confirm deletion

**Expected:**
- ✅ Post removed from list
- ✅ Database updated

### Test 15: Products Management

**Create Product:**
1. Navigate to "Товары" tab
2. Click "Добавить товар"
3. Enter:
   - Name: "Test Product"
   - Article: "TEST-999" (must be unique)
   - Description: "Test description"
   - Image URL: Valid image URL
   - Rating: 5
   - Order link: "#"
   - Subcategory: Select any
4. Click "Добавить товар"

**Expected:**
- ✅ Product appears in list
- ✅ Article is unique (error if duplicate)
- ✅ Image displays correctly

**Edit Product:**
1. Click edit icon on product
2. Modify fields
3. Save changes

**Expected:**
- ✅ Changes saved
- ✅ Product updated immediately

**Delete Product:**
1. Click delete icon
2. Confirm deletion

**Expected:**
- ✅ Product removed
- ✅ Database updated

### Test 16: Categories Management

**Create Category:**
1. Navigate to "Категории" tab
2. Click "Добавить категорию"
3. Enter name and select icon
4. Save

**Expected:**
- ✅ Category appears
- ✅ Icon displayed correctly

**Delete Category:**
1. Click delete on category
2. Confirm

**Expected:**
- ✅ Category removed
- ✅ Associated subcategories removed (cascade)

### Test 17: Hero Content Management

**Update Hero Text:**
1. Navigate to "Герой" tab
2. Modify title and description
3. Click "Сохранить изменения"

**Expected:**
- ✅ Changes saved
- ✅ Homepage reflects new content

**Manage Hero Slides:**
1. Add new slide with image URL
2. Drag to reorder
3. Delete a slide

**Expected:**
- ✅ Slides added/removed
- ✅ Order saved
- ✅ Homepage carousel updates

---

## PHASE 5: Search & Filter Testing

### Test 18: Product Search

**Search by name:**
1. Go to homepage
2. Enter "футболка" in search
3. Press search

**Expected:**
- ✅ Only matching products shown
- ✅ Search term highlighted

**Search by article:**
1. Enter "TSH-001"
2. Press search

**Expected:**
- ✅ Specific product found by article

**Clear search:**
1. Clear search field
2. Press search

**Expected:**
- ✅ All products shown again

### Test 19: Category Filtering

1. Click on a category
2. Verify only products from that category show
3. Click subcategory
4. Verify filtering works correctly

**Expected:**
- ✅ Correct products filtered
- ✅ UI updates smoothly

---

## PHASE 6: Production Testing

### Test 20: Deployment Verification

**After deploying to Railway + Vercel:**

1. Open bot in Telegram production bot
2. Click menu button
3. App loads from Vercel

**Check:**
- ✅ HTTPS enabled
- ✅ No mixed content warnings
- ✅ No CORS errors
- ✅ Telegram auth works
- ✅ All features functional

### Test 21: Production Authentication

**Verify JWT Secret:**
```bash
# In Railway environment variables
echo $JWT_SECRET
# Should be 32+ random characters
```

**Test token expiry:**
1. Login to admin panel
2. Wait 7 days (or manually modify token)
3. Try to access protected endpoint

**Expected:**
- ✅ 401 error after 7 days
- ✅ User redirected to re-authenticate

### Test 22: Rate Limiting

**Test general rate limit (100 req/15min):**
```bash
for i in {1..101}; do
  curl http://localhost:3001/api/products
done
```

**Expected:**
- ✅ First 100 requests succeed
- ✅ 101st request gets 429 (Too Many Requests)

**Test auth rate limit (10 req/15min):**
```bash
for i in {1..11}; do
  curl -X POST http://localhost:3001/api/auth/telegram \
    -H "Content-Type: application/json" \
    -d '{"initData":"invalid"}'
done
```

**Expected:**
- ✅ First 10 requests processed (may fail auth but not rate-limited)
- ✅ 11th request gets 429

### Test 23: Security Headers

**Check Helmet headers:**
```bash
curl -I https://your-backend.up.railway.app/api/categories
```

**Expected headers:**
```
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Download-Options: noopen
X-Content-Type-Options: nosniff
X-XSS-Protection: 0
```

### Test 24: Database Persistence

1. Create a new product in admin panel
2. Restart backend server
3. Check if product still exists

**Expected:**
- ✅ Data persists after restart
- ✅ SQLite file intact

---

## PHASE 7: Error Handling Testing

### Test 25: Invalid Token

```bash
curl http://localhost:3001/api/products \
  -X POST \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

**Expected:**
```json
{
  "error": "Invalid or expired token"
}
```

### Test 26: Expired Token

1. Manually modify token expiry (or wait 7 days)
2. Make API request

**Expected:**
- ✅ 403 Forbidden
- ✅ Frontend clears token
- ✅ User prompted to re-authenticate

### Test 27: Missing Required Fields

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test"}'
```

**Expected:**
```json
{
  "error": "name, article and subcategory_id are required"
}
```

### Test 28: Duplicate Article

1. Create product with article "TEST-001"
2. Try to create another product with same article

**Expected:**
- ✅ Error: "UNIQUE constraint failed"
- ✅ Product not created

---

## PHASE 8: Performance Testing

### Test 29: Load Time

**Measure frontend load time:**
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check "Load" time

**Target:** < 2 seconds

### Test 30: API Response Time

```bash
time curl http://localhost:3001/api/products
```

**Target:** < 100ms

### Test 31: Database Query Performance

Add to `server.js`:
```javascript
db.prepare('SELECT * FROM products').all();
console.timeEnd('products-query');
```

**Target:** < 50ms for 1000 products

---

## Test Results Checklist

### Local Development
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] API endpoints respond correctly
- [ ] Search works
- [ ] Authentication works
- [ ] Admin panel loads

### Telegram Integration
- [ ] ngrok exposes localhost
- [ ] Bot configured in @BotFather
- [ ] WebApp opens in Telegram
- [ ] Telegram SDK loads
- [ ] Auto-authentication works
- [ ] Theme colors applied

### Admin Functionality
- [ ] User roles enforced
- [ ] Posts CRUD works
- [ ] Products CRUD works
- [ ] Categories CRUD works
- [ ] Hero content management works

### Security
- [ ] JWT tokens required for protected routes
- [ ] Invalid tokens rejected
- [ ] Rate limiting active
- [ ] Helmet headers present
- [ ] Passwords hashed
- [ ] CORS restricted

### Production
- [ ] Deployed to Railway/Vercel
- [ ] HTTPS enabled
- [ ] Environment variables set
- [ ] Database persists
- [ ] No CORS errors
- [ ] Performance acceptable

---

## Debugging Tips

### Check Backend Logs
```bash
# Railway
railway logs

# Local
# Check terminal running npm start
```

### Check Frontend Console
```javascript
// In browser DevTools console
console.log('Telegram:', window.Telegram?.WebApp);
console.log('Token:', localStorage.getItem('telegram_auth_token'));
console.log('User:', localStorage.getItem('telegram_auth_user'));
```

### Check Database
```bash
# SQLite CLI
sqlite3 backend/database.sqlite

# List tables
.tables

# Query users
SELECT * FROM telegram_users;

# Query products
SELECT * FROM products;
```

### Network Debugging
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Check request/response for each API call

---

## Success Criteria

✅ **All tests pass**
✅ **No console errors**
✅ **No network errors**
✅ **Security headers present**
✅ **Authentication works**
✅ **Admin panel functional**
✅ **Data persists**
✅ **Performance acceptable**

**When all criteria met: READY FOR PRODUCTION! 🎉**
