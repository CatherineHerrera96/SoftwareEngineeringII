-- Seed Habits (System Habits)
-- Categories: Wellness, Health, Academic, Work

-- Wellness
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Meditate 10 mins', 'Take 10 minutes to breathe and center yourself.', 'Wellness', 'daily', FALSE),
('Read for pleasure', 'Read at least 10 pages of a book you enjoy.', 'Wellness', 'daily', FALSE),
('Journaling', 'Write down your thoughts or gratitude for the day.', 'Wellness', 'daily', FALSE),
('No screens before bed', 'Avoid screens 30 minutes before sleeping.', 'Wellness', 'daily', FALSE);

-- Health
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Drink 2L Water', 'Stay hydrated throughout the day.', 'Health', 'daily', FALSE),
('Walk 20 mins', 'Go for a brisk walk outside.', 'Health', 'daily', FALSE),
('Eat a healthy breakfast', 'Start the day with nutritious food.', 'Health', 'daily', FALSE),
('7+ hours sleep', 'Get adequate rest for recovery.', 'Health', 'daily', FALSE),
('Gym / Workout', 'Exercise for at least 30 minutes.', 'Health', 'daily', FALSE);

-- Academic
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Study 1 hour', 'Dedicated focused study time.', 'Academic', 'daily', FALSE),
('Review notes', 'Review notes from previous lectures.', 'Academic', 'daily', FALSE),
('Complete assignments', 'Work on pending homework or projects.', 'Academic', 'daily', FALSE),
('Read research paper', 'Read one academic article or paper.', 'Academic', 'weekly', FALSE);

-- Work
INSERT INTO habits (name, description, category, frequency, is_custom) VALUES 
('Plan tomorrow tasks', 'List top 3 priorities for the next day.', 'Work', 'daily', FALSE),
('Inbox Zero', 'Clear out email inbox.', 'Work', 'daily', FALSE),
('Deep Work Session', '90 minutes of uninterrupted work.', 'Work', 'daily', FALSE),
('Update documentation', 'Keep project docs up to date.', 'Work', 'weekly', FALSE);

-- Seasonal
INSERT INTO habits (name, description, category, frequency, is_custom, season_id) VALUES 
('Read Christmas Stories', 'Read a festive story for 20 minutes.', 'Seasonal', 'daily', FALSE, 'christmas'),
('Drink Hot Cocoa', 'Enjoy a warm cup of cocoa.', 'Seasonal', 'weekly', FALSE, 'christmas'),
('Wrap Gifts', 'Prepare gifts for friends and family.', 'Seasonal', 'weekly', FALSE, 'christmas'),
('Decorate for Christmas', 'Add some festive cheer to your home.', 'Seasonal', 'weekly', FALSE, 'christmas');

-- Seed Achievements
INSERT INTO achievements (name, description, threshold_type, threshold_value) VALUES 
('First Step', 'Complete your first habit check-in.', 'total_completions', 1),
('Momentum Builder', 'Complete 10 total check-ins.', 'total_completions', 10),
('Habit Master', 'Complete 50 total check-ins.', 'total_completions', 50),
('Hat Trick', 'Reach a 3-day streak on any habit.', 'per_habit_streak', 3),
('Week Warrior', 'Reach a 7-day streak on any habit.', 'per_habit_streak', 7),
('Monthly Master', 'Reach a 30-day streak on any habit.', 'per_habit_streak', 30),
('Perfect Day', 'Complete all active habits in a single day.', 'per_habit_streak', 1);