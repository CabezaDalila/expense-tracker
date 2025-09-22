-- Create expenses table for tracking all expenses
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('fijo', 'variable', 'tarjeta')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagado', 'pendiente')),
  due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_due_date ON expenses(due_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);

-- Insert sample data based on the Excel spreadsheet
INSERT INTO expenses (user_id, description, amount, category, status, due_date, notes) VALUES
('sample_user', 'Caece', 289200.00, 'fijo', 'pagado', '2025-07-01', 'Universidad'),
('sample_user', 'Celus dali+ Mtv', 29000.00, 'fijo', 'pagado', '2025-07-01', 'Servicios'),
('sample_user', 'ICBC', 512525.69, 'tarjeta', 'pagado', '2025-07-02', 'Tarjeta de crédito'),
('sample_user', 'Galicia visa', 62405.99, 'tarjeta', 'pagado', '2025-07-05', 'Tarjeta de crédito'),
('sample_user', 'BBVA manu', 89722.09, 'tarjeta', 'pagado', '2025-07-07', 'Tarjeta de crédito'),
('sample_user', 'BBVA dali', 580591.72, 'tarjeta', 'pagado', '2025-07-07', 'Tarjeta de crédito'),
('sample_user', 'Parquero', 35000.00, 'fijo', 'pagado', '2025-07-08', 'Casa Country'),
('sample_user', 'Internet', 21905.00, 'fijo', 'pendiente', '2025-01-15', 'Casa Country'),
('sample_user', 'Luz', 30000.00, 'fijo', 'pendiente', '2025-01-20', 'Casa Country'),
('sample_user', 'Country', 217468.59, 'fijo', 'pendiente', '2025-01-25', 'Casa Country'),
('sample_user', 'Seguro (BBVA D)', 33680.00, 'fijo', 'pendiente', '2025-01-30', 'Casa Country'),
('sample_user', 'Cochera', 70000.00, 'fijo', 'pagado', '2025-07-10', 'Estacionamiento'),
('sample_user', 'Agua dpto', 21000.00, 'variable', 'pendiente', '2025-01-18', 'Departamento'),
('sample_user', 'Gas dpto', 5500.00, 'variable', 'pendiente', '2025-01-22', 'Departamento'),
('sample_user', 'Guardería Bote', 20000.00, 'variable', 'pendiente', '2025-01-28', 'Extras');
