/*
  # Project Management System

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `workspace_id` (uuid, foreign key to workspaces)
      - `created_by` (uuid, foreign key to users)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)

  2. Security
    - Enable RLS on projects table
    - Only workspace members can access projects
    - Workspace members can create projects
    - Project management based on workspace roles
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  description text CHECK (length(description) <= 1000),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS projects_workspace_id_idx ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS projects_created_by_idx ON projects(created_by);
CREATE INDEX IF NOT EXISTS projects_is_active_idx ON projects(is_active);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Workspace members can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = projects.workspace_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = current_user_id() AND
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = projects.workspace_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin', 'member')
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = projects.workspace_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin', 'member')
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace admins can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = projects.workspace_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin')
        AND workspace_members.is_active = true
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();