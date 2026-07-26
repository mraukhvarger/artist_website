import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

// Раздаем загруженные картинки как статичные файлы (/uploads/...)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(uploadDir));

// Настройка Multer для сохранения изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'artist_user',
  password: process.env.DB_PASSWORD || 'artist_pass',
  database: process.env.DB_NAME || 'artist_db',
  port: 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-it';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'sister_admin';
// Теперь используем обычный текстовый пароль из ENV
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'ArtistSecret2024!';

// Middleware для проверки JWT-токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Токен отсутствует' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Недействительный или истекший токен' });
    req.user = user;
    next();
  });
};

// --- АВТОРИЗАЦИЯ ПРЯМЫМ СРАВНЕНИЕМ ПАРОЛЯ ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(400).json({ error: 'Неверное имя пользователя или пароль' });
  }

  // Выдаем токен на 24 часа
  const token = jwt.sign({ username: ADMIN_USERNAME }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token });
});

// --- ПУБЛИЧНЫЕ ЭНДПОИНТЫ ---

// Получить каталог картин
app.get('/api/artworks', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM artworks ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Заказ картины покупателем
app.post('/api/orders', async (req, res) => {
  const { artwork_id, customer_name, customer_email, customer_phone, shipping_address } = req.body;
  try {
    const art = await pool.query('SELECT price, status FROM artworks WHERE id = $1', [artwork_id]);
    if (art.rows.length === 0 || art.rows[0].status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Картина недоступна для покупки' });
    }

    const price = art.rows[0].price;
    const query = `
      INSERT INTO orders (artwork_id, customer_name, customer_email, customer_phone, shipping_address, amount)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;
    `;
    const { rows } = await pool.query(query, [artwork_id, customer_name, customer_email, customer_phone, shipping_address, price]);
    
    // Тут в будущем вызывается API ЮKassa / Т-Банк и возвращается payment_url
    res.status(201).json({ order: rows[0], payment_url: 'https://payment-gateway-mock.ru/pay/' + rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ЗАЩИЩЕННЫЕ ЭНДПОИНТЫ (ТРЕБУЮТ JWT TOKEN) ---

// Загрузка фото картины
app.post('/api/admin/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  res.json({ image_url: `/uploads/${req.file.filename}` });
});

// Создать картину
app.post('/api/artworks', authenticateToken, async (req, res) => {
  const { title, description, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url } = req.body;
  try {
    const query = `
      INSERT INTO artworks (title, description, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;
    const values = [title, description, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Обновить картину
app.put('/api/artworks/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url } = req.body;
  try {
    const query = `
      UPDATE artworks 
      SET title=$1, description=$2, technique=$3, dimensions=$4, year_created=$5, price=$6, status=$7, exhibition_location=$8, collection_name=$9, image_url=$10
      WHERE id=$11 RETURNING *;
    `;
    const values = [title, description, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url, id];
    const { rows } = await pool.query(query, values);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить картину
app.delete('/api/artworks/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM artworks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Удалено' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Просмотр поступающих заказов
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, a.title as artwork_title 
      FROM orders o 
      LEFT JOIN artworks a ON o.artwork_id = a.id 
      ORDER BY o.id DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));