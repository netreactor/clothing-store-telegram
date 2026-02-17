# ⚡ Быстрый старт

## Установка и запуск за 3 минуты

### Шаг 1: Установите зависимости

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### Шаг 2: Запустите проекты

Откройте **ДВА** терминала:

**Терминал 1 (Backend):**
```bash
cd backend
npm start
```

**Терминал 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Шаг 3: Откройте в браузере

- **Сайт:** http://localhost:5173
- **Админка:** http://localhost:5173/#/admin
- **API:** http://localhost:3001/api/products

### Логин в админ панель:

- Логин: `admin`
- Пароль: `admin`

---

## ✅ Готово!

Теперь у вас работает:
- ✅ Сайт магазина
- ✅ Админ панель
- ✅ База данных (общая для всех)
- ✅ Поиск по товарам
- ✅ Артикулы товаров

---

## 🔍 Как использовать поиск?

1. Откройте главную страницу
2. Вкладка "Все товары"
3. Введите в поиск:
   - Название товара: `футболка`
   - Артикул: `TSH-001`
   - Часть описания: `хлопок`

---

## 🛠️ Как добавить товар?

1. Откройте админку: http://localhost:5173/#/admin
2. Войдите (admin/admin)
3. Вкладка "Товары"
4. Кнопка "Добавить товар"
5. Заполните форму:
   - Название
   - **Артикул** (уникальный!)
   - Описание
   - Картинка (URL)
   - Рейтинг
   - Ссылка
   - Подкатегория

---

## 📦 Деплой

### Backend → Render.com (бесплатно)
1. Зарегистрируйтесь на render.com
2. New → Web Service
3. Connect репозиторий
4. Root: `backend`
5. Build: `npm install`
6. Start: `npm start`

### Frontend → Vercel.com (бесплатно)
1. Зарегистрируйтесь на vercel.com
2. Import project
3. Root: `frontend`
4. Build: `npm run build`
5. Environment:
   - `VITE_API_URL` = URL вашего backend

---

Всё! 🚀
