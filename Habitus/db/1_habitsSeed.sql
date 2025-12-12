-- Seed values for system pre-generated habits
-- Core Habits
INSERT INTO habits (name, category, description, frequency, is_custom, season_id) VALUES
-- Health & Fitness
('Drink Water', 'health', 'Drink 8 glasses of water daily.', 'daily', FALSE, NULL),
('Exercise', 'health', '30 minutes of physical activity.', 'daily', FALSE, NULL),
('Sleep 8 Hours', 'health', 'Get a full night''s rest.', 'daily', FALSE, NULL),
('Healthy Breakfast', 'health', 'Start the day with a nutritious meal.', 'daily', FALSE, NULL),
('No Sugar', 'health', 'Avoid sugary snacks and drinks.', 'daily', FALSE, NULL),
('Take Vitamins', 'health', 'Take daily supplements.', 'daily', FALSE, NULL),
('Stretching', 'health', '10 minutes of stretching.', 'daily', FALSE, NULL),
('Walk 5k Steps', 'health', 'Keep moving throughout the day.', 'daily', FALSE, NULL),
('Floss Teeth', 'health', 'Dental hygiene is key.', 'daily', FALSE, NULL),
('Cook a Meal', 'health', 'Prepare a home-cooked meal.', 'daily', FALSE, NULL),
-- Mindfulness & Spirit
('Meditate', 'mindfulness', '10 minutes of mindfulness meditation.', 'daily', FALSE, NULL),
('Journaling', 'mindfulness', 'Write down your thoughts and feelings.', 'daily', FALSE, NULL),
('Gratitude', 'mindfulness', 'List 3 things you are grateful for.', 'daily', FALSE, NULL),
('Digital Detox', 'mindfulness', '1 hour without screens.', 'daily', FALSE, NULL),
('Deep Breathing', 'mindfulness', '5 minutes of breathwork.', 'daily', FALSE, NULL),
('Morning Affirmations', 'mindfulness', 'Start the day with positive intent.', 'daily', FALSE, NULL),
('Prayer/Reflection', 'mindfulness', 'Spiritual connection time.', 'daily', FALSE, NULL),
-- Productivity & Growth
('Plan the Day', 'productivity', 'Outline your tasks for the day.', 'daily', FALSE, NULL),
('Deep Work', 'productivity', '1 hour of focused, distraction-free work.', 'daily', FALSE, NULL),
('Inbox Zero', 'productivity', 'Clear out emails and notifications.', 'daily', FALSE, NULL),
('Review Goals', 'productivity', 'Check progress on long-term goals.', 'daily', FALSE, NULL),
('Tidy Workspace', 'productivity', 'Clear desk, clear mind.', 'daily', FALSE, NULL),
('Read', 'learning', 'Read a book or article for 20 minutes.', 'daily', FALSE, NULL),
('Learn Language', 'learning', 'Practice vocabulary or Duolingo.', 'daily', FALSE, NULL),
('Code Practice', 'learning', 'Solve one algorithm or write code.', 'daily', FALSE, NULL),
('Watch Documentary', 'learning', 'Learn something new about the world.', 'daily', FALSE, NULL),
('Listen to Podcast', 'learning', 'Educational audio content.', 'daily', FALSE, NULL),
-- Social & Kindness
('Call a Friend', 'social', 'Reach out to someone you care about.', 'daily', FALSE, NULL),
('Family Time', 'social', 'Uninterrupted time with family.', 'daily', FALSE, NULL),
('Compliment Someone', 'social', 'Make someone''s day brighter.', 'daily', FALSE, NULL),
('Volunteer/Help', 'social', 'Do a good deed.', 'daily', FALSE, NULL),
('Network', 'social', 'Connect with a professional contact.', 'daily', FALSE, NULL),
-- Creativity & Hobbies
('Draw/Paint', 'creativity', 'Express yourself visually.', 'daily', FALSE, NULL),
('Write 500 Words', 'creativity', 'Fiction, blog, or essays.', 'daily', FALSE, NULL),
('Play Instrument', 'creativity', 'Practice music.', 'daily', FALSE, NULL),
('Photography', 'creativity', 'Take a photo of something interesting.', 'daily', FALSE, NULL),
('DIY Project', 'creativity', 'Work on a craft or repair.', 'daily', FALSE, NULL),
-- Finance
('Track Spending', 'finance', 'Update your budget ledger.', 'daily', FALSE, NULL),
('Save $5', 'finance', 'Put small amount into savings.', 'daily', FALSE, NULL),
('No Spur Spending', 'finance', 'Stick strictly to the list.', 'daily', FALSE, NULL);

-- Seasonal habits
INSERT INTO habits (name, category, description, frequency, is_custom, season_id) VALUES
-- Cosmere RPG
('Read Stormlight Archive', 'cosmere', 'Read at least 15 minutes of Brandon Sanderson''s epic.', 'daily', FALSE, 'cosmere'),
('Practice Allomancy', 'cosmere', 'Mental exercises to burn metals (focus & mindfulness).', 'daily', FALSE, 'cosmere'),
('Say the Ideals', 'cosmere', 'Recite the Immortal Words: Life before Death.', 'daily', FALSE, 'cosmere'),
('Investiture Meditation', 'cosmere', 'Breathing exercises to gather Stormlight.', 'daily', FALSE, 'cosmere'),
('Speak with Spren', 'cosmere', 'A moment of gratitude to attract positive honorspren.', 'daily', FALSE, 'cosmere'),
-- The 100
('Survival Training', 'the100', 'Physical workout to survive on the ground.', 'daily', FALSE, 'the100'),
('Grounder Language', 'the100', 'Learn 5 new words in Trigedasleng.', 'daily', FALSE, 'the100'),
('Maintain the Ark', 'the100', 'Clean and organize your living space.', 'daily', FALSE, 'the100'),
('Radio Check', 'the100', 'Reach out to a friend or family member (Raven style).', 'daily', FALSE, 'the100'),
('Avoid Acid Fog', 'the100', 'Stay indoors and focus on deep work for 1 hour.', 'daily', FALSE, 'the100'),
-- New Year
('Write 2026 Resolutions', 'new_year', 'Reflect on goals for the upcoming year.', 'daily', FALSE, 'new_year'),
('Daily Declutter', 'new_year', 'Remove 3 items you no longer need.', 'daily', FALSE, 'new_year'),
('Financial Review', 'new_year', 'Check spending and savings goals.', 'daily', FALSE, 'new_year'),
('Learn a New Skill', 'new_year', 'Spend 20 mins practicing something new.', 'daily', FALSE, 'new_year'),
-- Christmas
('Gift Wrapping', 'christmas', 'Wrap presents or prepare thoughtful notes.', 'daily', FALSE, 'christmas'),
('Drink Hot Cocoa', 'christmas', 'Relax with a warm holiday beverage.', 'daily', FALSE, 'christmas'),
('Holiday Reading', 'christmas', 'Read a festive story or article.', 'daily', FALSE, 'christmas'),
('Snow Walk', 'christmas', 'Take a walk outside (even if there''s no snow!).', 'daily', FALSE, 'christmas'),
('Decoration Tidy', 'christmas', 'Maintain or adjust holiday decorations.', 'daily', FALSE, 'christmas'),
-- Halloween
('Watch a Scary Movie', 'halloween', 'Get spurred by adrenaline!', 'daily', FALSE, 'halloween'),
('Pumpkin Carving Plan', 'halloween', 'Sketch or plan a creative design.', 'daily', FALSE, 'halloween'),
('Night Walk', 'halloween', 'A spooky evening stroll.', 'daily', FALSE, 'halloween'),
('Eat Less Candy', 'halloween', 'Resist the sugar rush (or enjoy just one!).', 'daily', FALSE, 'halloween'),
('Costume Prep', 'halloween', 'Work on your Halloween outfit.', 'daily', FALSE, 'halloween'),
-- Summer
('Hydrate', 'summer', 'Drink 8 glasses of water.', 'daily', FALSE, 'summer'),
('Sunscreen Application', 'summer', 'Protect your skin before going out.', 'daily', FALSE, 'summer'),
('Morning Swim/Run', 'summer', 'Exercise while it''s still cool.', 'daily', FALSE, 'summer'),
('Eat Fresh Fruit', 'summer', 'Enjoy seasonal berries or melon.', 'daily', FALSE, 'summer'),
('Sunset Watch', 'summer', 'Relax and watch the day end.', 'daily', FALSE, 'summer'),
-- Valentine
('Express Love', 'valentine', 'Tell someone you appreciate them.', 'daily', FALSE, 'valentine'),
('Self-Care Date', 'valentine', 'Treat yourself to something nice.', 'daily', FALSE, 'valentine'),
('Write a Poem', 'valentine', 'Creative writing about emotions.', 'daily', FALSE, 'valentine'),
('Quality Time', 'valentine', 'Spend focused time with a partner or friend.', 'daily', FALSE, 'valentine'),
-- April Fools
('Plan a Prank', 'april_fools', 'Think of a harmless, funny joke.', 'daily', FALSE, 'april_fools'),
('Laugh Daily', 'april_fools', 'Watch a comedy clip or tell a joke.', 'daily', FALSE, 'april_fools'),
('Practice Magic', 'april_fools', 'Learn a simple sleight of hand trick.', 'daily', FALSE, 'april_fools'),
('Juggling', 'april_fools', 'Practice coordination (clown training).', 'daily', FALSE, 'april_fools'),
-- Spring
('Plant Seeds', 'spring', 'Start a garden or tend to plants.', 'daily', FALSE, 'spring'),
('Spring Cleaning', 'spring', 'Deep clean one small area.', 'daily', FALSE, 'spring'),
('Nature Walk', 'spring', 'Look for blooming flowers.', 'daily', FALSE, 'spring'),
('Open Windows', 'spring', 'Let fresh air circulate.', 'daily', FALSE, 'spring');
