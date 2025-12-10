-- Add timezone to users if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='timezone') THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(64) DEFAULT 'UTC';
    END IF;
END $$;

-- Update habits table
ALTER TABLE habits ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update user_habits table
ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS longest_streak INT NOT NULL DEFAULT 0;
ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS total_completions INT DEFAULT 0;
ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS last_completed_at DATE;
ALTER TABLE user_habits ADD COLUMN IF NOT EXISTS next_available_checkin_at DATE;
ALTER TABLE user_habits ALTER COLUMN current_streak SET DEFAULT 0;
ALTER TABLE user_habits ALTER COLUMN current_streak SET NOT NULL;

-- Create daily_checkins table (replaces habit_tracker)
CREATE TABLE IF NOT EXISTS daily_checkins (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    habit_id INT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    completed BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, habit_id, date)
);

-- Create index for daily_checkins
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_habit_date ON daily_checkins (user_id, habit_id, date);

-- Migrate data from habit_tracker to daily_checkins if habit_tracker exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'habit_tracker') THEN
        INSERT INTO daily_checkins (user_id, habit_id, date, completed, created_at)
        SELECT uh.user_id, uh.habit_id, ht.log_date, ht.is_completed, ht.created_at
        FROM habit_tracker ht
        JOIN user_habits uh ON ht.user_habit_id = uh.id
        ON CONFLICT (user_id, habit_id, date) DO NOTHING;
    END IF;
END $$;

-- Update achievements table
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS code VARCHAR(50);
-- We might need to populate codes for existing achievements or create new ones.
-- For now, let's ensure the column exists.

-- Update user_achievements table
-- It seems the table name was user_achievements in the original SQL but referenced as usr_achievements in models.
-- Let's ensure it matches the plan.
ALTER TABLE user_achievements ADD COLUMN IF NOT EXISTS awarded_at TIMESTAMP DEFAULT NOW();
