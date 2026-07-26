-- Таблица картин
CREATE TABLE IF NOT EXISTS artworks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    technique VARCHAR(255), -- например: "Холст, масло"
    dimensions VARCHAR(100), -- например: "50x70 см"
    year_created INT,
    price NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', 
    -- Возможные статусы: 'AVAILABLE' (В наличии), 'SOLD' (Продано), 'ON_EXHIBITION' (На выставке), 'PRIVATE_COLLECTION' (В коллекции)
    exhibition_location TEXT, -- Адрес/название галереи (если status = 'ON_EXHIBITION')
    collection_name VARCHAR(255), -- Название серии/коллекции
    image_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заказов
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    artwork_id INT REFERENCES artworks(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    shipping_address TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PAID', 'CANCELLED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Тестовые данные
INSERT INTO artworks (title, technique, dimensions, year_created, price, status, exhibition_location, collection_name, image_url) 
VALUES 
('Вечерний туман', 'Холст, масло', '50x70 см', 2024, 45000, 'AVAILABLE', NULL, 'Пейзажи', '/uploads/demo1.jpg'),
('Отражение в канале', 'Холст, масло', '60x80 см', 2023, 60000, 'ON_EXHIBITION', 'Галерея "Эрмитаж-Урал", Зал 3, г. Екатеринбург', 'Городские виды', '/uploads/demo2.jpg');