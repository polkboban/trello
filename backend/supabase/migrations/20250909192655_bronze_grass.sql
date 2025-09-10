/*
  # Task Management System

  1. New Tables
    - `tasks`
      - Core task information with status, priority, due dates
    - `subtasks`
      - Hierarchical subtasks for task breakdown
    - `task_assignments`
      - Many-to-many relationship for task assignments
    - `task_labels`
      - Categorization and labeling system

  2. Security
    - Enable RLS on all tables
    - Access control based on workspace membership
    - Fine-grained permissions for different operations
*/

-- Main tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  description text CHECK (length(description) <= 2000),
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date timestamptz,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  description text CHECK (length(description) <= 1000),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Task assignments table (many-to-many)
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  
  UNIQUE(task_id, user_id)
);

-- Task labels table
CREATE TABLE IF NOT EXISTS task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
  color text DEFAULT '#3B82F6' CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(workspace_id, name)
);

-- Task-label junction table
CREATE TABLE IF NOT EXISTS task_label_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  label_id uuid REFERENCES task_labels(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(task_id, label_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS tasks_project_id_idx ON tasks(project_id);
CREATE INDEX IF NOT EXISTS tasks_created_by_idx ON tasks(created_by);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_priority_idx ON tasks(priority);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);
CREATE INDEX IF NOT EXISTS subtasks_task_id_idx ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_task_id_idx ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS task_assignments_user_id_idx ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS task_labels_workspace_id_idx ON task_labels(workspace_id);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_label_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Workspace members can read tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can create tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = current_user_id() AND
    EXISTS (
      SELECT 1 FROM projects 
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin', 'member')
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can update tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can delete tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE projects.id = tasks.project_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin', 'member')
        AND workspace_members.is_active = true
    )
  );

-- Similar RLS policies for subtasks, task_assignments, task_labels, and task_label_assignments
CREATE POLICY "Workspace members can manage subtasks"
  ON subtasks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = subtasks.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can manage task assignments"
  ON task_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_assignments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can manage task labels"
  ON task_labels
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = task_labels.workspace_id
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can manage task label assignments"
  ON task_label_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = task_label_assignments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update task completion
CREATE OR REPLACE FUNCTION update_task_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = now();
  ELSIF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for task completion
CREATE TRIGGER update_task_completion_trigger
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_task_completion();

-- Function to update subtask completion
CREATE OR REPLACE FUNCTION update_subtask_completion()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false AND OLD.is_completed = true THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for subtask completion
CREATE TRIGGER update_subtask_completion_trigger
  BEFORE UPDATE ON subtasks
  FOR EACH ROW
  EXECUTE FUNCTION update_subtask_completion();