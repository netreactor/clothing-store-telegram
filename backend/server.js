import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { authenticateToken, requireRole, optionalAuth } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Validation helper
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// 1. Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  xFrameOptions: false,
}));

// 2. CORS - Telegram Mini App compatible
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// 3. Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later.',
});

// 4. Body parser
app.use(express.json({ limit: '10mb' }));

// ============================================
// DATABASE INITIALIZATION
// ============================================

const db = new Database(join(__dirname, 'database.sqlite'));
db.pragma('journal_mode = WAL');

function initDatabase() {
  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'shirt',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Subcategories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subcategories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      article TEXT UNIQUE NOT NULL,
      description TEXT,
      image_url TEXT,
      rating INTEGER DEFAULT 0,
      order_link TEXT,
      subcategory_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
    )
  `);

  // Posts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      author_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      telegram_user_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (telegram_user_id) REFERENCES telegram_users(id)
    )
  `);

  // Admin users table (legacy - kept for backward compatibility)
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_master INTEGER DEFAULT 0,
      can_manage_categories INTEGER DEFAULT 0,
      can_manage_products INTEGER DEFAULT 0,
      can_manage_posts INTEGER DEFAULT 0,
      can_manage_admins INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hero content table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_content (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Hero slides table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hero_slides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      caption TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // NEW: Telegram users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS telegram_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      telegram_id TEXT UNIQUE NOT NULL,
      username TEXT,
      first_name TEXT,
      last_name TEXT,
      photo_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_login TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Migration: Add icon column to categories if not exists
  const categoryColumns = db.prepare("PRAGMA table_info(categories)").all();
  if (!categoryColumns.some((column) => column.name === 'icon')) {
    db.exec("ALTER TABLE categories ADD COLUMN icon TEXT DEFAULT 'shirt'");
  }

  // Migration: Add telegram_user_id to posts if not exists
  const postsColumns = db.prepare("PRAGMA table_info(posts)").all();
  if (!postsColumns.some((column) => column.name === 'telegram_user_id')) {
    db.exec("ALTER TABLE posts ADD COLUMN telegram_user_id INTEGER REFERENCES telegram_users(id)");
  }

  // Initialize hero content if empty
  const heroContent = db.prepare('SELECT id FROM hero_content WHERE id = 1').get();
  if (!heroContent) {
    db.prepare(`
      INSERT INTO hero_content (id, title, description)
      VALUES (1, ?, ?)
    `).run(
      'Реалистичный минимализм — будто вещь находится прямо перед вами',
      'Мы оставили спокойное пространство и один акцент: фактуру ткани, мягкий реальный свет и глубину, которая делает каталог ближе к физическому миру.'
    );
  }

  // Insert sample data if database is empty
  const categoriesCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoriesCount.count === 0) {
    insertSampleData();
  }

  const slidesCount = db.prepare('SELECT COUNT(*) as count FROM hero_slides').get();
  if (slidesCount.count === 0) {
    insertDefaultHeroSlides();
  }

  // Hash existing plaintext passwords in admin_users
  if (process.env.NODE_ENV === 'production') {
    hashExistingPasswords();
  }

  console.log('✅ Database initialized successfully');
}

function hashExistingPasswords() {
  const adminUsers = db.prepare('SELECT id, password FROM admin_users').all();
  
  for (const user of adminUsers) {
    // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    if (!user.password.match(/^\$2[ayb]\$.{56}$/)) {
      const hashed = bcrypt.hashSync(user.password, 10);
      db.prepare('UPDATE admin_users SET password = ? WHERE id = ?').run(hashed, user.id);
      console.log(`✅ Hashed password for admin user ID ${user.id}`);
    }
  }
}

function insertDefaultHeroSlides() {
  const insertSlide = db.prepare('INSERT INTO hero_slides (image_url, caption, sort_order) VALUES (?, ?, ?)');

  insertSlide.run('https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=900', 'Шелковая блузка', 0);
  insertSlide.run('https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=900', 'Летнее платье', 1);
  insertSlide.run('https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900', 'Классическая футболка', 2);
}

function insertSampleData() {
  // Insert categories
  const insertCategory = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
  const cat1 = insertCategory.run('Мужская одежда', 'shirt');
  const cat2 = insertCategory.run('Женская одежда', 'sparkles');
  const cat3 = insertCategory.run('Аксессуары', 'watch');

  // Insert subcategories
  const insertSubcategory = db.prepare('INSERT INTO subcategories (name, category_id) VALUES (?, ?)');
  const sub1 = insertSubcategory.run('Футболки', cat1.lastInsertRowid);
  const sub2 = insertSubcategory.run('Джинсы', cat1.lastInsertRowid);
  const sub3 = insertSubcategory.run('Куртки', cat1.lastInsertRowid);
  const sub4 = insertSubcategory.run('Платья', cat2.lastInsertRowid);
  const sub5 = insertSubcategory.run('Блузки', cat2.lastInsertRowid);
  const sub6 = insertSubcategory.run('Юбки', cat2.lastInsertRowid);
  const sub7 = insertSubcategory.run('Сумки', cat3.lastInsertRowid);
  const sub8 = insertSubcategory.run('Часы', cat3.lastInsertRowid);

  // Insert products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, article, description, image_url, rating, order_link, subcategory_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertProduct.run(
    'Классическая футболка',
    'TSH-001',
    'Удобная хлопковая футболка черного цвета',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    5,
    '#',
    sub1.lastInsertRowid
  );
  
  insertProduct.run(
    'Джинсы прямого кроя',
    'JNS-002',
    'Классические синие джинсы',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    4,
    '#',
    sub2.lastInsertRowid
  );
  
  insertProduct.run(
    'Кожаная куртка',
    'JKT-003',
    'Стильная кожаная куртка',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    5,
    '#',
    sub3.lastInsertRowid
  );
  
  insertProduct.run(
    'Летнее платье',
    'DRS-004',
    'Легкое платье для лета',
    'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    4,
    '#',
    sub4.lastInsertRowid
  );
  
  insertProduct.run(
    'Шелковая блузка',
    'BLS-005',
    'Элегантная шелковая блузка',
    'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400',
    5,
    '#',
    sub5.lastInsertRowid
  );

  // Insert master admin (only in development)
  if (process.env.NODE_ENV !== 'production') {
    const insertAdmin = db.prepare(`
      INSERT INTO admin_users (username, password, is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const hashedPassword = bcrypt.hashSync('admin', 10);
    insertAdmin.run('admin', hashedPassword, 1, 1, 1, 1, 1);
  }

  // Insert sample posts
  const insertPost = db.prepare(`
    INSERT INTO posts (title, content, image_url, author_id, author_name) 
    VALUES (?, ?, ?, ?, ?)
  `);
  insertPost.run(
    'Новая коллекция весна 2026',
    '<p>Мы рады представить вам нашу новую весеннюю коллекцию! В ней вы найдете стильные и удобные вещи для любого случая.</p><p><br></p><p>Не пропустите скидки до 30% на первую неделю!</p>',
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    1,
    'admin'
  );
  insertPost.run(
    'Распродажа зимней коллекции',
    '<p>Скидки до 50% на всю зимнюю коллекцию! Только до конца месяца.</p>',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800',
    1,
    'admin'
  );

  console.log('✅ Sample data inserted successfully');
}

// ============================================
// TELEGRAM AUTHENTICATION
// ============================================

/**
 * Validate Telegram WebApp initData using HMAC SHA-256
 * Official docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
function validateTelegramAuth(initData) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  
  if (!hash) {
    return { valid: false, error: 'No hash provided' };
  }

  params.delete('hash');

  // Create data check string
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Calculate secret key
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Verify hash
  if (calculatedHash !== hash) {
    return { valid: false, error: 'Invalid hash' };
  }

  // Check auth_date (prevent replay attacks - 24 hours expiry)
  const authDate = parseInt(params.get('auth_date'));
  const now = Math.floor(Date.now() / 1000);
  
  if (now - authDate > 86400) {
    return { valid: false, error: 'Authentication expired' };
  }

  // Extract user data
  try {
    const userData = JSON.parse(params.get('user'));
    return { valid: true, user: userData };
  } catch (error) {
    return { valid: false, error: 'Invalid user data' };
  }
}

/**
 * POST /api/auth/telegram
 * Authenticate user via Telegram WebApp initData
 * Returns JWT token for subsequent API calls
 */
app.post('/api/auth/telegram', authLimiter, (req, res) => {
  try {
    const { initData } = req.body;

    if (!initData) {
      return res.status(400).json({ error: 'initData is required' });
    }

    // Validate Telegram authentication
    const validation = validateTelegramAuth(initData);

    if (!validation.valid) {
      return res.status(401).json({ error: validation.error });
    }

    const telegramUser = validation.user;

    // Find or create user in database
    let user = db.prepare('SELECT * FROM telegram_users WHERE telegram_id = ?')
      .get(telegramUser.id.toString());

    if (!user) {
      // Create new user
      const result = db.prepare(`
        INSERT INTO telegram_users (telegram_id, username, first_name, last_name, photo_url, role)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        telegramUser.id.toString(),
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.photo_url || null,
        'user' // default role
      );

      user = db.prepare('SELECT * FROM telegram_users WHERE id = ?').get(result.lastInsertRowid);
    } else {
      // Update last login and user info
      db.prepare(`
        UPDATE telegram_users 
        SET username = ?, first_name = ?, last_name = ?, photo_url = ?, last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        telegramUser.username || null,
        telegramUser.first_name || null,
        telegramUser.last_name || null,
        telegramUser.photo_url || null,
        user.id
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        telegramId: user.telegram_id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user info
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, telegram_id, username, first_name, last_name, role FROM telegram_users WHERE id = ?')
    .get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    telegramId: user.telegram_id,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  });
});

/**
 * FALLBACK: Legacy admin authentication (for development/testing only)
 * Only works in development mode
 */
app.post('/api/auth/admin', authLimiter, (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Admin login disabled in production' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password (bcrypt)
    const valid = bcrypt.compareSync(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.is_master ? 'master_admin' : 'admin',
        isLegacyAdmin: true,
      },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.is_master ? 'master_admin' : 'admin',
      },
    });
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ============================================
// PUBLIC API ENDPOINTS (No Authentication Required)
// ============================================

// Categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subcategories
app.get('/api/subcategories', (req, res) => {
  try {
    const { category_id } = req.query;
    let query = 'SELECT * FROM subcategories';
    const params = [];
    
    if (category_id) {
      query += ' WHERE category_id = ?';
      params.push(category_id);
    }
    
    query += ' ORDER BY name';
    const subcategories = db.prepare(query).all(...params);
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products
app.get('/api/products', (req, res) => {
  try {
    const { subcategory_id, search } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    const conditions = [];
    
    if (subcategory_id) {
      conditions.push('subcategory_id = ?');
      params.push(subcategory_id);
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR article LIKE ? OR description LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name';
    const products = db.prepare(query).all(...params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Posts
app.get('/api/posts', (req, res) => {
  try {
    const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hero Content
app.get('/api/hero-content', (req, res) => {
  try {
    const heroContent = db.prepare('SELECT * FROM hero_content WHERE id = 1').get();
    res.json(heroContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hero Slides
app.get('/api/hero-slides', (req, res) => {
  try {
    const slides = db.prepare('SELECT * FROM hero_slides ORDER BY sort_order ASC, id ASC').all();
    res.json(slides);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Users (public read-only for backward compatibility)
app.get('/api/admin-users', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins, created_at FROM admin_users ORDER BY created_at').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/admin-users/:username', (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins, created_at FROM admin_users WHERE username = ?').get(req.params.username);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PROTECTED API ENDPOINTS (Require Authentication + Admin Role)
// ============================================

// Categories - Admin only
app.post('/api/categories', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { name, icon } = req.body;
    if (!isNonEmptyString(name)) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const normalizedIcon = isNonEmptyString(icon) ? icon.trim() : 'shirt';
    const result = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)').run(name.trim(), normalizedIcon);
    res.json({ id: result.lastInsertRowid, name: name.trim(), icon: normalizedIcon });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Subcategories - Admin only
app.post('/api/subcategories', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { name, category_id } = req.body;
    if (!isNonEmptyString(name) || !Number.isInteger(category_id)) {
      return res.status(400).json({ error: 'Subcategory name and category_id are required' });
    }

    const result = db.prepare('INSERT INTO subcategories (name, category_id) VALUES (?, ?)').run(name.trim(), category_id);
    res.json({ id: result.lastInsertRowid, name: name.trim(), category_id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/subcategories/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM subcategories WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products - Admin only
app.post('/api/products', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { name, article, description, image_url, rating, order_link, subcategory_id } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(article) || !Number.isInteger(subcategory_id)) {
      return res.status(400).json({ error: 'name, article and subcategory_id are required' });
    }

    const result = db.prepare(`
      INSERT INTO products (name, article, description, image_url, rating, order_link, subcategory_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), article.trim(), description?.trim() || null, image_url?.trim() || null, rating ?? 0, order_link?.trim() || null, subcategory_id);
    
    res.json({ id: result.lastInsertRowid, ...req.body, name: name.trim(), article: article.trim() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { name, article, description, image_url, rating, order_link, subcategory_id } = req.body;
    if (!isNonEmptyString(name) || !isNonEmptyString(article) || !Number.isInteger(subcategory_id)) {
      return res.status(400).json({ error: 'name, article and subcategory_id are required' });
    }

    db.prepare(`
      UPDATE products 
      SET name = ?, article = ?, description = ?, image_url = ?, rating = ?, order_link = ?, subcategory_id = ?
      WHERE id = ?
    `).run(name.trim(), article.trim(), description?.trim() || null, image_url?.trim() || null, rating ?? 0, order_link?.trim() || null, subcategory_id, req.params.id);
    
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Posts - Admin only
app.post('/api/posts', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    if (!isNonEmptyString(title) || !isNonEmptyString(content)) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // Use Telegram user info from JWT
    const result = db.prepare(`
      INSERT INTO posts (title, content, image_url, author_id, author_name, telegram_user_id) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      title.trim(), 
      content, 
      image_url?.trim() || null, 
      req.user.id,
      req.user.username || req.user.firstName || 'Admin',
      req.user.id
    );
    
    res.json({ 
      id: result.lastInsertRowid, 
      title: title.trim(), 
      content,
      image_url: image_url?.trim() || null,
      author_id: req.user.id,
      author_name: req.user.username || req.user.firstName || 'Admin'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/posts/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { title, content, image_url } = req.body;
    db.prepare(`
      UPDATE posts 
      SET title = ?, content = ?, image_url = ?
      WHERE id = ?
    `).run(title, content, image_url, req.params.id);
    
    res.json({ id: req.params.id, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/posts/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hero Content - Admin only
app.put('/api/hero-content', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { title, description } = req.body;
    if (!isNonEmptyString(title) || !isNonEmptyString(description)) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    db.prepare(`
      UPDATE hero_content
      SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(title.trim(), description.trim());

    const heroContent = db.prepare('SELECT * FROM hero_content WHERE id = 1').get();
    res.json(heroContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hero Slides - Admin only
app.post('/api/hero-slides', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { image_url, caption, sort_order } = req.body;
    if (!isNonEmptyString(image_url)) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    const normalizedOrder = Number.isInteger(sort_order)
      ? sort_order
      : db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM hero_slides').get().next_order;

    const result = db.prepare(`
      INSERT INTO hero_slides (image_url, caption, sort_order)
      VALUES (?, ?, ?)
    `).run(image_url.trim(), caption?.trim() || null, normalizedOrder);

    const slide = db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(result.lastInsertRowid);
    res.json(slide);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/hero-slides/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    const { image_url, caption, sort_order } = req.body;
    if (!isNonEmptyString(image_url) || !Number.isInteger(sort_order)) {
      return res.status(400).json({ error: 'image_url and sort_order are required' });
    }

    db.prepare(`
      UPDATE hero_slides
      SET image_url = ?, caption = ?, sort_order = ?
      WHERE id = ?
    `).run(image_url.trim(), caption?.trim() || null, sort_order, req.params.id);

    const slide = db.prepare('SELECT * FROM hero_slides WHERE id = ?').get(req.params.id);
    res.json(slide);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hero-slides/:id', authenticateToken, requireRole(['admin', 'master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM hero_slides WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Users Management - Master Admin only
app.post('/api/admin-users', authenticateToken, requireRole(['master_admin']), (req, res) => {
  try {
    const { username, password, is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const result = db.prepare(`
      INSERT INTO admin_users (username, password, is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username.trim(), hashedPassword, is_master ? 1 : 0, can_manage_categories ? 1 : 0, can_manage_products ? 1 : 0, can_manage_posts ? 1 : 0, can_manage_admins ? 1 : 0);
    
    res.json({ id: result.lastInsertRowid, username: username.trim(), is_master, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin-users/:id', authenticateToken, requireRole(['master_admin']), (req, res) => {
  try {
    const { password, can_manage_categories, can_manage_products, can_manage_posts, can_manage_admins } = req.body;
    const fields = [];
    const values = [];
    
    if (password !== undefined && password !== '') {
      fields.push('password = ?');
      values.push(bcrypt.hashSync(password, 10));
    }
    if (can_manage_categories !== undefined) {
      fields.push('can_manage_categories = ?');
      values.push(can_manage_categories ? 1 : 0);
    }
    if (can_manage_products !== undefined) {
      fields.push('can_manage_products = ?');
      values.push(can_manage_products ? 1 : 0);
    }
    if (can_manage_posts !== undefined) {
      fields.push('can_manage_posts = ?');
      values.push(can_manage_posts ? 1 : 0);
    }
    if (can_manage_admins !== undefined) {
      fields.push('can_manage_admins = ?');
      values.push(can_manage_admins ? 1 : 0);
    }
    
    if (fields.length > 0) {
      values.push(req.params.id);
      db.prepare(`UPDATE admin_users SET ${fields.join(', ')} WHERE id = ? AND is_master = 0`).run(...values);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin-users/:id', authenticateToken, requireRole(['master_admin']), (req, res) => {
  try {
    db.prepare('DELETE FROM admin_users WHERE id = ? AND is_master = 0').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Telegram Users Management - Master Admin only
app.get('/api/telegram-users', authenticateToken, requireRole(['master_admin']), (req, res) => {
  try {
    const users = db.prepare('SELECT id, telegram_id, username, first_name, last_name, role, created_at, last_login FROM telegram_users ORDER BY created_at DESC').all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/telegram-users/:id/role', authenticateToken, requireRole(['master_admin']), (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin', 'master_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be: user, admin, or master_admin' });
    }

    db.prepare('UPDATE telegram_users SET role = ? WHERE id = ?').run(role, req.params.id);
    
    const user = db.prepare('SELECT id, telegram_id, username, first_name, last_name, role FROM telegram_users WHERE id = ?').get(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// ============================================
// START SERVER
// ============================================

initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${join(__dirname, 'database.sqlite')}`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Telegram Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '⚠️ Using fallback (not secure!)'}`);
});
