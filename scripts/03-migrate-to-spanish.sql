-- Migrate existing data to Spanish values
-- First, update the constraint to allow both old and new values temporarily
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_category_check;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;

-- Add new constraints that allow both old and new values
ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
  CHECK (category IN ('fixed', 'variable', 'credit_card', 'fijo', 'variable', 'tarjeta'));

ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
  CHECK (status IN ('pending', 'paid', 'pendiente', 'pagado'));

-- Update existing data to Spanish values
UPDATE expenses SET category = 'fijo' WHERE category = 'fixed';
UPDATE expenses SET category = 'tarjeta' WHERE category = 'credit_card';
UPDATE expenses SET status = 'pagado' WHERE status = 'paid';
UPDATE expenses SET status = 'pendiente' WHERE status = 'pending';

-- Now update constraints to only allow Spanish values
ALTER TABLE expenses DROP CONSTRAINT expenses_category_check;
ALTER TABLE expenses DROP CONSTRAINT expenses_status_check;

ALTER TABLE expenses ADD CONSTRAINT expenses_category_check 
  CHECK (category IN ('fijo', 'variable', 'tarjeta'));

ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
  CHECK (status IN ('pendiente', 'pagado'));

-- Update default value for status
ALTER TABLE expenses ALTER COLUMN status SET DEFAULT 'pendiente';
