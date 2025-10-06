-- Create your custom user
CREATE USER voicebook_user WITH PASSWORD 'voicebook_password';

-- Create your database
CREATE DATABASE voicebook_db OWNER voicebook_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE voicebook_db TO voicebook_user;

-- Create achievements table if not exists
CREATE TABLE IF NOT EXISTS achievements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    category VARCHAR(50) NOT NULL,
    category_icon VARCHAR(50) NOT NULL,
    rarity VARCHAR(20) NOT NULL,
    required_progress INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table if not exists
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT FALSE,
    date_unlocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, achievement_id)
);

-- Insert default achievements (only if they don't exist)
INSERT INTO achievements (id, title, description, icon, category, category_icon, rarity, required_progress)
VALUES
(1, 'Первый шаг', 'Сделал первую голосовую запись в дневнике', '🎤', 'voice', '🎤', 'common', 1),
(2, '7 дней подряд', 'Вел голосовой дневник неделю без пропусков', '🔥', 'regularity', '📅', 'rare', 7),
(3, 'Месячный марафон', '30 дней ведения голосового дневника', '🏆', 'regularity', '📅', 'epic', 30),
(4, 'Радуга эмоций', 'Выразил 5 или более разных эмоций в записях', '🌈', 'variety', '🎭', 'rare', 5),
(5, 'Взгляд в прошлое', 'Прослушал записи за другой день (месяц назад)', '🔍', 'reflection', '🤔', 'rare', 1),
(6, 'Луч света', 'Серия из 5 позитивных записей после грустной', '✨', 'positivity', '😊', 'epic', 5),
(7, 'Эмоциональный детектив', 'Проанализировал 50 различных записей', '🕵️', 'analysis', '📊', 'legendary', 50),
(8, 'Голос сердца', 'Записал 100 минут размышлений', '💖', 'voice', '🎤', 'common', 100),
(9, 'Сердечный друг', 'Поделился достижениями с друзьями', '💖', 'social', '💬', 'common', 1)
ON CONFLICT (id) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (FIXED - added UNIQUE constraint on user_id)
CREATE TABLE IF NOT EXISTS session (
    session_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES "user"(user_id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Records table
CREATE TABLE IF NOT EXISTS record (
    record_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    emotion VARCHAR(50),
    summary TEXT,
    feedback INTEGER CHECK (feedback >= 1 AND feedback <= 5),
    insights TEXT
);

-- User totals table
CREATE TABLE IF NOT EXISTS user_totals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    emotion VARCHAR(50),
    summary TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_login ON "user"(login);
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_record_user_id ON record(user_id);
CREATE INDEX IF NOT EXISTS idx_record_date ON record(record_date);
CREATE INDEX IF NOT EXISTS idx_record_user_date ON record(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_user_totals_user_id ON user_totals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_totals_date ON user_totals(date);
CREATE INDEX IF NOT EXISTS idx_user_totals_user_date ON user_totals(user_id, date);

CREATE TABLE IF NOT EXISTS vk_user (
    id SERIAL PRIMARY KEY,
    vk_user_id INTEGER UNIQUE NOT NULL,
    coins INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Обновляем таблицу user_achievements для поддержки VK пользователей
DROP TABLE IF EXISTS user_achievements;
CREATE TABLE IF NOT EXISTS user_achievements (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('regular', 'vk')),
    user_id INTEGER NOT NULL,
    achievement_id INTEGER REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT FALSE,
    date_unlocked TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_type, user_id, achievement_id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_user_achievements_type_user ON user_achievements(user_type, user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked);

-- Добавляем поле user_type в таблицу record
ALTER TABLE record ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'regular' CHECK (user_type IN ('regular', 'vk'));

-- Обновляем индексы
CREATE INDEX IF NOT EXISTS idx_record_user_type ON record(user_type, user_id);

ALTER TABLE record ADD COLUMN user_type VARCHAR(20) DEFAULT 'regular' CHECK (user_type IN ('regular', 'vk'));