DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS daily_checkins;
DROP TABLE IF EXISTS user_habits;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    email          VARCHAR(255) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    name           VARCHAR(255),
    avatar_url     VARCHAR(255),
    timezone       VARCHAR(64) DEFAULT 'UTC',
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habits (
    id           SERIAL PRIMARY KEY,
    user_id      INT REFERENCES users(id) ON DELETE CASCADE, -- Nullable for system habits
    name         VARCHAR(255) NOT NULL,
    description  TEXT,
    category     VARCHAR(100),
    frequency    VARCHAR(50),
    is_custom    BOOLEAN NOT NULL DEFAULT FALSE,
    season_id    VARCHAR(50), -- NEW: tracks seasonal affinity (e.g., 'christmas', 'halloween', NULL for permanent)
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_habits (
    id                         SERIAL PRIMARY KEY,
    user_id                    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id                   INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    is_active                  BOOLEAN DEFAULT TRUE,
    current_streak             INT NOT NULL DEFAULT 0,
    longest_streak             INT NOT NULL DEFAULT 0,
    total_completions          INT DEFAULT 0,
    last_completed_at          DATE,
    next_available_checkin_at  DATE,
    activated_at               DATE DEFAULT NOW(),
    UNIQUE(user_id, habit_id)
);

CREATE TABLE habit_tracker (
    id             SERIAL PRIMARY KEY,
    user_habit_id  INT NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
    log_date       DATE NOT NULL,
    is_completed   BOOLEAN NOT NULL,
    created_at     TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_habit_id, log_date)
);

CREATE TABLE achievements (
    id               SERIAL PRIMARY KEY,
    code             VARCHAR(25),
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    category         VARCHAR(25),
    tier             VARCHAR(25),
    icon_emoji       VARCHAR(25),
    threshold_type   VARCHAR(25) NOT NULL,
    threshold_value  INT NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id  INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    habit_id        INT REFERENCES habits(id) ON DELETE CASCADE DEFAULT NULL,
    awarded_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);