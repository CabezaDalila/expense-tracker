-- Create expenses table for expense tracking app
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fijo', 'variable', 'tarjeta')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
  due_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Insert sample data based on the user's Excel
INSERT INTO expenses (user_id, description, amount, category, status, due_date) VALUES
('demo-user', 'Caece', 289200.00, 'fijo', 'pagado', '2025-01-01'),
('demo-user', 'Celus dali+ Mtv', 29000.00, 'fijo', 'pagado', '2025-01-01'),
('demo-user', 'ICBC', 512525.69, 'tarjeta', 'pagado', '2025-02-01'),
('demo-user', 'Galicia visa', 62405.99, 'tarjeta', 'pagado', '2025-05-01'),
('demo-user', 'BBVA manu', 89722.09, 'tarjeta', 'pagado', '2025-07-01'),
('demo-user', 'BBVA dali', 580591.72, 'tarjeta', 'pagado', '2025-07-01'),
('demo-user', 'Parquero', 35000.00, 'fijo', 'pagado', '2025-08-01'),
('demo-user', 'Cochera', 70000.00, 'fijo', 'pagado', '2025-10-01'),
('demo-user', 'Internet', 21905.00, 'fijo', 'pendiente', '2025-01-15'),
('demo-user', 'Luz', 30000.00, 'variable', 'pendiente', '2025-01-20'),
('demo-user', 'Country', 217468.59, 'fijo', 'pendiente', '2025-01-25'),
('demo-user', 'Seguro (BBVA D)', 33680.00, 'fijo', 'pendiente', '2025-02-01');
