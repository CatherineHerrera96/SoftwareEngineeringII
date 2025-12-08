-- Migration: Add season_id to habits table
-- Date: 2025-12-08
-- Purpose: Enable seasonal habit filtering

ALTER TABLE habits 
ADD COLUMN season_id VARCHAR(50);

COMMENT ON COLUMN habits.season_id IS 'Seasonal affinity: christmas, halloween, summer, etc. NULL = permanent habit';
