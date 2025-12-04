DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS habit_tracker;
DROP TABLE IF EXISTS user_habits;
DROP TABLE IF EXISTS achievements;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(255),
    timezone VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE habits (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_habits (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    activated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, habit_id)
);

CREATE TABLE habit_tracker (
    id SERIAL PRIMARY KEY,
    user_habit_id INT NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_habit_id, log_date)
);

CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    condition_type VARCHAR(100),
    threshold INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);



