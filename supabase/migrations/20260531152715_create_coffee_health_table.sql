-- ============================================================================
-- Migration: create_coffee_health_table
-- Description: Creates the coffee_health table to store synthetic health and
--              coffee consumption data from the CSV dataset (10,000 rows).
--              Designed with scale in mind (indexes on filterable columns).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Create ENUM types for categorical columns
--    Using enums instead of plain text provides:
--    - Data integrity (only valid values can be inserted)
--    - Smaller storage footprint (internally stored as integers)
--    - Faster comparisons on indexed columns at scale
-- ---------------------------------------------------------------------------

CREATE TYPE public.gender_type AS ENUM ('Male', 'Female', 'Other');
CREATE TYPE public.sleep_quality_type AS ENUM ('Poor', 'Fair', 'Good', 'Excellent');
CREATE TYPE public.stress_level_type AS ENUM ('Low', 'Medium', 'High');
CREATE TYPE public.health_issues_type AS ENUM ('None', 'Mild', 'Moderate', 'Severe');
CREATE TYPE public.occupation_type AS ENUM ('Healthcare', 'Office', 'Other', 'Service', 'Student');

-- ---------------------------------------------------------------------------
-- 2. Create the main table
-- ---------------------------------------------------------------------------

CREATE TABLE public.coffee_health (
  id                      INTEGER PRIMARY KEY,
  age                     SMALLINT        NOT NULL CHECK (age >= 0),
  gender                  public.gender_type       NOT NULL,
  country                 TEXT            NOT NULL,
  coffee_intake           NUMERIC(4, 1)   NOT NULL,
  caffeine_mg             NUMERIC(6, 1)   NOT NULL,
  sleep_hours             NUMERIC(3, 1)   NOT NULL,
  sleep_quality           public.sleep_quality_type NOT NULL,
  bmi                     NUMERIC(4, 1)   NOT NULL,
  heart_rate              SMALLINT        NOT NULL CHECK (heart_rate >= 0),
  stress_level            public.stress_level_type  NOT NULL,
  physical_activity_hours NUMERIC(3, 1)   NOT NULL,
  health_issues           public.health_issues_type NOT NULL,
  occupation              public.occupation_type    NOT NULL,
  smoking                 BOOLEAN         NOT NULL DEFAULT FALSE,
  alcohol_consumption     BOOLEAN         NOT NULL DEFAULT FALSE
);

-- Add a comment to the table for documentation
COMMENT ON TABLE public.coffee_health IS
  'Synthetic health and coffee consumption dataset. Each row represents one individual with demographic, lifestyle, and health metrics.';

-- ---------------------------------------------------------------------------
-- 3. Create indexes for filterable columns (scale-aware)
--    These indexes accelerate WHERE clauses for the most common filter
--    patterns in the UI. With millions of rows, queries that scan by
--    country, gender, or quality levels benefit from B-tree indexes.
-- ---------------------------------------------------------------------------

-- Single-column indexes on categorical filters (exact match / IN queries)
CREATE INDEX idx_coffee_health_country        ON public.coffee_health (country);
CREATE INDEX idx_coffee_health_gender         ON public.coffee_health (gender);
CREATE INDEX idx_coffee_health_sleep_quality  ON public.coffee_health (sleep_quality);
CREATE INDEX idx_coffee_health_stress_level   ON public.coffee_health (stress_level);
CREATE INDEX idx_coffee_health_health_issues  ON public.coffee_health (health_issues);
CREATE INDEX idx_coffee_health_occupation     ON public.coffee_health (occupation);

-- Single-column indexes on numeric range filters (BETWEEN / >= / <=)
CREATE INDEX idx_coffee_health_age            ON public.coffee_health (age);
CREATE INDEX idx_coffee_health_bmi            ON public.coffee_health (bmi);
CREATE INDEX idx_coffee_health_coffee_intake  ON public.coffee_health (coffee_intake);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
--    Enable RLS and create a permissive policy for public read access.
--    This is the recommended Supabase pattern — even for public data,
--    RLS should be enabled so that the table is secure by default.
-- ---------------------------------------------------------------------------

ALTER TABLE public.coffee_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.coffee_health
  AS PERMISSIVE
  FOR SELECT
  TO public
  USING (true);

-- ---------------------------------------------------------------------------
-- 5. Grant permissions to Supabase roles
--    Following the same pattern as the existing notes table.
--    Only SELECT is needed since the data is read-only for the app.
-- ---------------------------------------------------------------------------

GRANT SELECT ON TABLE public.coffee_health TO anon;
GRANT SELECT ON TABLE public.coffee_health TO authenticated;
GRANT ALL    ON TABLE public.coffee_health TO service_role;
