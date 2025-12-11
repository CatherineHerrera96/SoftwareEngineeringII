------------------------------------------------------------
-- 1. List all habits activated by each user
------------------------------------------------------------
SELECT u.email, h.name AS habit, h.category, h.frequency, uh.is_active
FROM users u
JOIN user_habits uh ON u.id = uh.user_id
JOIN habits h ON h.id = uh.habit_id;


------------------------------------------------------------
-- 2. Show which achievements each user has unlocked
------------------------------------------------------------
SELECT u.email, a.name AS achievement, a.threshold, a.description
FROM users u
JOIN user_achievements ua ON u.id = ua.user_id
JOIN achievements a ON ua.achievement_id = a.id;


------------------------------------------------------------
-- 3. List users who don't have any active habits
------------------------------------------------------------
SELECT u.id, u.email
FROM users u
LEFT JOIN user_habits uh ON u.id = uh.user_id
WHERE uh.id IS NULL;


------------------------------------------------------------
-- 4. Count how many habits each user is currently tracking
------------------------------------------------------------
SELECT u.email, COUNT(uh.id) AS total_habits
FROM users u
LEFT JOIN user_habits uh ON u.id = uh.user_id
GROUP BY u.email;


------------------------------------------------------------
-- 5. Get all inactive habits for all users
------------------------------------------------------------
SELECT u.email, h.name AS habit, uh.is_active
FROM user_habits uh
JOIN users u ON u.id = uh.user_id
JOIN habits h ON h.id = uh.habit_id
WHERE uh.is_active = FALSE;


------------------------------------------------------------
-- 6. Show all habit tracker logs including user and habit
------------------------------------------------------------
SELECT u.email, h.name AS habit, ht.log_date, ht.is_completed
FROM habit_tracker ht
JOIN user_habits uh ON uh.id = ht.user_habit_id
JOIN users u ON u.id = uh.user_id
JOIN habits h ON h.id = uh.habit_id
ORDER BY ht.log_date DESC;


------------------------------------------------------------
-- 7. Count how many times each habit has been completed
------------------------------------------------------------
SELECT h.name AS habit, COUNT(*) FILTER (WHERE ht.is_completed) AS completed_days
FROM habit_tracker ht
JOIN user_habits uh ON uh.id = ht.user_habit_id
JOIN habits h ON h.id = uh.habit_id
GROUP BY h.name;


------------------------------------------------------------
-- 8. Calculate completion rate for each habit
------------------------------------------------------------
SELECT 
    h.name AS habit,
    ROUND(
        100.0 * SUM(CASE WHEN ht.is_completed THEN 1 ELSE 0 END) / COUNT(*),
        2
    ) AS completion_rate
FROM habit_tracker ht
JOIN user_habits uh ON uh.id = ht.user_habit_id
JOIN habits h ON h.id = uh.habit_id
GROUP BY h.name;


------------------------------------------------------------
-- 9. List users who haven't unlocked any achievements
------------------------------------------------------------
SELECT u.email
FROM users u
LEFT JOIN user_achievements ua ON u.id = ua.user_id
WHERE ua.id IS NULL;


------------------------------------------------------------
-- 10. Count how many users unlocked each achievement
------------------------------------------------------------
SELECT a.name AS achievement, COUNT(ua.id) AS users_unlocked
FROM achievements a
LEFT JOIN user_achievements ua ON a.id = ua.achievement_id
GROUP BY a.name;


------------------------------------------------------------
-- 11. List habits that no user has activated
------------------------------------------------------------
SELECT h.*
FROM habits h
LEFT JOIN user_habits uh ON h.id = uh.habit_id
WHERE uh.id IS NULL;


------------------------------------------------------------
-- 12. Find the most commonly activated habit
------------------------------------------------------------
SELECT h.name AS habit, COUNT(uh.habit_id) AS activations
FROM habits h
JOIN user_habits uh ON h.id = uh.habit_id
GROUP BY h.name
ORDER BY activations DESC
LIMIT 1;


------------------------------------------------------------
-- 13. Get daily logs for a specific user and habit
------------------------------------------------------------
SELECT ht.log_date, ht.is_completed
FROM habit_tracker ht
JOIN user_habits uh ON uh.id = ht.user_habit_id
WHERE uh.user_id = 1
  AND uh.habit_id = 1
ORDER BY ht.log_date;