-- ==========================================
-- 1. SEED: users (20 Users)
-- ==========================================
INSERT INTO users (email, password_hash) VALUES
('alice.smith@example.com', 'hash_secret_1'),
('bob.jones@example.com', 'hash_secret_2'),
('charlie.brown@example.com', 'hash_secret_3'),
('david.williams@example.com', 'hash_secret_4'),
('eve.davis@example.com', 'hash_secret_5'),
('frank.miller@example.com', 'hash_secret_6'),
('grace.wilson@example.com', 'hash_secret_7'),
('henry.moore@example.com', 'hash_secret_8'),
('isabella.taylor@example.com', 'hash_secret_9'),
('jack.anderson@example.com', 'hash_secret_10'),
('karen.thomas@example.com', 'hash_secret_11'),
('liam.jackson@example.com', 'hash_secret_12'),
('mia.white@example.com', 'hash_secret_13'),
('noah.harris@example.com', 'hash_secret_14'),
('olivia.martin@example.com', 'hash_secret_15'),
('peter.thompson@example.com', 'hash_secret_16'),
('quinn.garcia@example.com', 'hash_secret_17'),
('rachel.martinez@example.com', 'hash_secret_18'),
('sam.robinson@example.com', 'hash_secret_19'),
('tina.clark@example.com', 'hash_secret_20');

-- ==========================================
-- 2. SEED: habits (Common Examples)
-- ==========================================
INSERT INTO habits (name, category, frequency, description) VALUES
('Drink Water', 'wellness', 'daily', 'Stay hydrated throughout the day.'),
('Meditate', 'wellness', 'daily', 'Practice mindfulness for 10 minutes.'),
('Walk Outdoors', 'wellness', 'weekly', 'Take a short walk in nature.'),
-- HEALTH
('Exercise', 'health', 'daily', 'Engage in physical activity for at least 30 minutes.'),
('Eat Healthy', 'health', 'daily', 'Consume balanced and nutritious meals.'),
('Meal Prep', 'health', 'weekly', 'Prepare healthy meals in advance.'),
-- ACADEMIC
('Study 45 min', 'academic', 'daily', 'Focus on a learning task without distractions.'),
('Read Book', 'academic', 'daily', 'Read a chapter for 20 minutes.'),
('Code Review', 'academic', 'weekly','Review code or learn new coding concepts.'),
-- WORK
('Plan my day', 'work', 'daily', 'Organize your tasks and priorities for the day.'),
('Journal', 'work', 'daily','Write down thoughts and reflections.'),
('Connect with Loved Ones', 'work', 'weekly','Spend quality time with family or friends.');

-- ==========================================
-- 3. SEED: user_habits (Assigning habits to users)
-- ==========================================
-- Assigning generic habits to various users (Assumes IDs 1-20 exist)
INSERT INTO user_habits (user_id, habit_id) VALUES
(1, 1), (1, 2), -- Alice does Water and Reading
(2, 1), (2, 3), -- Bob does Water and Gym
(3, 4),         -- Charlie Meditates
(4, 1), (4, 5), (4, 6), -- David is ambitious
(5, 2),
(6, 3), (6, 4),
(7, 1),
(8, 6),
(9, 1), (9, 2), (9, 3),
(10, 4),
(11, 1),
(12, 2),
(13, 5),
(14, 6),
(15, 1), (15, 2),
(16, 3),
(17, 4),
(18, 1),
(19, 2),
(20, 1), (20, 6);

-- ==========================================
-- 4. SEED: habit_tracker (Logging progress)
-- ==========================================
-- Simulating some logs for User 1 (Alice) and User 2 (Bob)
INSERT INTO habit_tracker (user_habit_id, log_date, is_completed) VALUES
-- User 1, Habit 1 (Water) - Streaks
(1, CURRENT_DATE - INTERVAL '3 days', TRUE),
(1, CURRENT_DATE - INTERVAL '2 days', TRUE),
(1, CURRENT_DATE - INTERVAL '1 days', TRUE),
(1, CURRENT_DATE, FALSE), -- Missed today

-- User 1, Habit 2 (Reading)
(2, CURRENT_DATE - INTERVAL '2 days', TRUE),
(2, CURRENT_DATE - INTERVAL '1 days', FALSE),

-- User 2, Habit 3 (Gym)
(4, CURRENT_DATE - INTERVAL '3 days', TRUE),
(4, CURRENT_DATE - INTERVAL '1 days', TRUE);

-- ==========================================
-- 5. SEED: achievements (Gamification definitions)
-- ==========================================
INSERT INTO achievements (name, description, condition_type, threshold) VALUES
('Starter', 'Completed your first habit', 'count', 1),
('On Fire', 'Completed habits 7 days in a row', 'streak', 7),
('Hydration Hero', 'Drank water 30 times', 'specific_habit_count', 30),
('Master of Discipline', 'Completed 100 total habits', 'count', 100);

-- ==========================================
-- 6. SEED: user_achievements (Awards)
-- ==========================================
-- Granting 'Starter' achievement to Alice (1) and Bob (2)
INSERT INTO user_achievements (user_id, achievement_id) VALUES
(1, 1),
(2, 1);