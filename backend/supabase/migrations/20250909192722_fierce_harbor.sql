/*
  # Comments and Attachments System

  1. New Tables
    - `comments`
      - Task discussion and collaboration
    - `comment_mentions`
      - User mentions in comments
    - `attachments`
      - File attachments for tasks

  2. Security
    - Enable RLS on all tables
    - Access control based on workspace membership
    - File upload restrictions and validation
*/

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  is_edited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comment mentions table
CREATE TABLE IF NOT EXISTS comment_mentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  mentioned_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  UNIQUE(comment_id, mentioned_user_id)
);

-- Attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_url text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0),
  mime_type text NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS comments_task_id_idx ON comments(task_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
CREATE INDEX IF NOT EXISTS comments_parent_comment_id_idx ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS comment_mentions_comment_id_idx ON comment_mentions(comment_id);
CREATE INDEX IF NOT EXISTS comment_mentions_mentioned_user_id_idx ON comment_mentions(mentioned_user_id);
CREATE INDEX IF NOT EXISTS attachments_task_id_idx ON attachments(task_id);
CREATE INDEX IF NOT EXISTS attachments_uploaded_by_idx ON attachments(uploaded_by);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for comments
CREATE POLICY "Workspace members can read comments"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = comments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can create comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = current_user_id() AND
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = comments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (
    user_id = current_user_id() AND
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = comments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Users can delete their own comments or workspace admins can delete any"
  ON comments
  FOR DELETE
  TO authenticated
  USING (
    user_id = current_user_id() OR
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = comments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin')
        AND workspace_members.is_active = true
    )
  );

-- RLS Policies for comment mentions
CREATE POLICY "Workspace members can manage comment mentions"
  ON comment_mentions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM comments
      JOIN tasks ON tasks.id = comments.task_id
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE comments.id = comment_mentions.comment_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

-- RLS Policies for attachments
CREATE POLICY "Workspace members can read attachments"
  ON attachments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = attachments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Workspace members can upload attachments"
  ON attachments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = current_user_id() AND
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = attachments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "Users can delete their attachments or workspace admins can delete any"
  ON attachments
  FOR DELETE
  TO authenticated
  USING (
    uploaded_by = current_user_id() OR
    EXISTS (
      SELECT 1 FROM tasks
      JOIN projects ON projects.id = tasks.project_id
      JOIN workspace_members ON workspace_members.workspace_id = projects.workspace_id
      WHERE tasks.id = attachments.task_id 
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.role IN ('owner', 'admin')
        AND workspace_members.is_active = true
    )
  );

-- Trigger for updated_at on comments
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to mark comment as edited
CREATE OR REPLACE FUNCTION mark_comment_edited()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.content != OLD.content THEN
    NEW.is_edited = true;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger to mark comment as edited when content changes
CREATE TRIGGER mark_comment_edited_trigger
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION mark_comment_edited();