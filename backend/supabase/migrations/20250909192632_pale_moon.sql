/*
  # Workspace Management System

  1. New Tables
    - `workspaces`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `description` (text, optional)
      - `avatar_url` (text, optional)
      - `created_by` (uuid, foreign key to users)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp, default now)
      - `updated_at` (timestamp, default now)
    
    - `workspace_members`
      - `id` (uuid, primary key)
      - `workspace_id` (uuid, foreign key to workspaces)
      - `user_id` (uuid, foreign key to users)
      - `role` (text, enum: owner, admin, member, guest)
      - `joined_at` (timestamp, default now)
      - `invited_by` (uuid, foreign key to users)
      - `is_active` (boolean, default true)

  2. Security
    - Enable RLS on both tables
    - Workspace members can read workspace info
    - Only workspace members can access workspace data
    - Role-based permissions for modifications
*/

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) > 0 AND length(name) <= 100),
  description text CHECK (length(description) <= 500),
  avatar_url text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspace members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),
  joined_at timestamptz DEFAULT now(),
  invited_by uuid REFERENCES users(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  
  UNIQUE(workspace_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS workspaces_created_by_idx ON workspaces(created_by);
CREATE INDEX IF NOT EXISTS workspaces_is_active_idx ON workspaces(is_active);
CREATE INDEX IF NOT EXISTS workspace_members_workspace_id_idx ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS workspace_members_user_id_idx ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS workspace_members_role_idx ON workspace_members(role);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Workspace members can read workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = current_user_id());

CREATE POLICY "Workspace admins can update workspaces"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin')
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace owners can delete workspaces"
  ON workspaces
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members 
      WHERE workspace_members.workspace_id = workspaces.id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role = 'owner'
        AND workspace_members.is_active = true
    )
  );

-- RLS Policies for workspace_members
CREATE POLICY "Workspace members can read workspace membership"
  ON workspace_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
        AND wm2.user_id = current_user_id()
        AND wm2.is_active = true
    )
  );

CREATE POLICY "Workspace admins can manage membership"
  ON workspace_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm2
      WHERE wm2.workspace_id = workspace_members.workspace_id 
        AND wm2.user_id = current_user_id()
        AND wm2.role IN ('owner', 'admin')
        AND wm2.is_active = true
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();