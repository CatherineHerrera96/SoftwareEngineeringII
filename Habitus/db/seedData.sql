-- Seed Habits (System Habits)
-- Categories: Wellness, Health, Academic, Work

-- Wellness
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Meditate 10 mins', 'Take 10 minutes to breathe and center yourself.', 'Wellness', 'daily', false),
('Read for pleasure', 'Read at least 10 pages of a book you enjoy.', 'Wellness', 'daily', false),
('Journaling', 'Write down your thoughts or gratitude for the day.', 'Wellness', 'daily', false),
('No screens before bed', 'Avoid screens 30 minutes before sleeping.', 'Wellness', 'daily', false);

-- Health
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Drink 2L Water', 'Stay hydrated throughout the day.', 'Health', 'daily', false),
('Walk 20 mins', 'Go for a brisk walk outside.', 'Health', 'daily', false),
('Eat a healthy breakfast', 'Start the day with nutritious food.', 'Health', 'daily', false),
('7+ hours sleep', 'Get adequate rest for recovery.', 'Health', 'daily', false),
('Gym / Workout', 'Exercise for at least 30 minutes.', 'Health', 'daily', false);

-- Academic
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Study 1 hour', 'Dedicated focused study time.', 'Academic', 'daily', false),
('Review notes', 'Review notes from previous lectures.', 'Academic', 'daily', false),
('Complete assignments', 'Work on pending homework or projects.', 'Academic', 'daily', false),
('Read research paper', 'Read one academic article or paper.', 'Academic', 'weekly', false);

-- Work
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Plan tomorrow tasks', 'List top 3 priorities for the next day.', 'Work', 'daily', false),
('Inbox Zero', 'Clear out email inbox.', 'Work', 'daily', false),
('Deep Work Session', '90 minutes of uninterrupted work.', 'Work', 'daily', false),
('Update documentation', 'Keep project docs up to date.', 'Work', 'weekly', false);

-- Seed Achievements
INSERT INTO achievements (name, description, condition_type, threshold) VALUES 
('First Step', 'Complete your first habit check-in.', 'checkins_count', 1),
('Momentum Builder', 'Complete 10 total check-ins.', 'checkins_count', 10),
('Habit Master', 'Complete 50 total check-ins.', 'checkins_count', 50),
('Hat Trick', 'Reach a 3-day streak on any habit.', 'streak_days', 3),
('Week Warrior', 'Reach a 7-day streak on any habit.', 'streak_days', 7),
('Monthly Master', 'Reach a 30-day streak on any habit.', 'streak_days', 30),
('Perfect Day', 'Complete all active habits in a single day.', 'perfect_day', 1);