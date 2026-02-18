-- =============================================
-- Simplify quotation statuses to 3: pending, accepted, rejected
-- Run in Supabase Dashboard SQL Editor
-- =============================================

-- Step 1: Drop old CHECK constraint FIRST (it doesn't allow 'pending')
ALTER TABLE quotations_bonos2 DROP CONSTRAINT IF EXISTS quotations_bonos2_status_check;

-- Step 2: Migrate existing data to new statuses
UPDATE quotations_bonos2 SET status = 'pending' WHERE status IN ('draft', 'completed', 'sent');

-- Step 3: Add new constraint with only 3 statuses
ALTER TABLE quotations_bonos2 ADD CONSTRAINT quotations_bonos2_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected'));

-- Step 4: Change default from 'draft' to 'pending'
ALTER TABLE quotations_bonos2 ALTER COLUMN status SET DEFAULT 'pending';

-- Step 5: Allow comerciales to update their own quotations (status changes)
CREATE POLICY "Users can update own quotations_bonos2"
  ON quotations_bonos2 FOR UPDATE
  USING (auth.uid() = user_id);
