CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL CHECK (length(trim(title)) > 0),
    description TEXT CHECK (length(description) <= 2000),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
 );

ALTER TABLE tasks
    ALTER COLUMN id SET DEFAULT uuid_generate_v4();
ALTER TABLE tasks ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE tasks ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_title ON tasks(title);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';


-- Create trigger for updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert test data
INSERT INTO tasks (title, description, status, due_date) VALUES
     (
         'Setup Development Environment',
         'Install and configure',
         'completed',
         '2024-01-10 09:00:00+00'
     ),
     (
         'Implement User Authentication',
         'Create system with login',
         'in_progress',
         '2024-02-15 17:00:00+00'
     ),
     (
         'Design Database Schema',
         'Create comprehensive database schema',
         'pending',
         '2024-01-25 12:00:00+00'
     ),
     (
         'Write API Documentation',
         'Create detailed API',
         'pending',
         '2024-03-01 14:30:00+00'
     ) ON CONFLICT DO NOTHING;

-- Create view for task statistics
CREATE OR REPLACE VIEW task_statistics AS
SELECT
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_tasks,
    COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_tasks,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN due_date < CURRENT_TIMESTAMP AND status != 'completed' THEN 1 END) as overdue_tasks,
    COUNT(CASE WHEN due_date >= CURRENT_TIMESTAMP AND due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days' AND status != 'completed' THEN 1 END) as due_this_week
FROM tasks;

-- Grant permissions (if needed for specific user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

-- Show test data
SELECT
    id,
    title,
    status,
    due_date,
    created_at
FROM tasks
ORDER BY created_at DESC;
