/*
  # Notifications and Activity System

  1. New Tables
    - `notifications`
      - User notifications for various events
    - `activities`
      - Activity log for workspace/project/task changes

  2. Security
    - Enable RLS on all tables
    - Users can only see their own notifications
    - Activity access based on workspace membership
*/

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'task_assigned', 'task_due_soon', 'task_completed', 'task_status_changed',
    'mentioned', 'comment_added', 'attachment_added',
    'workspace_invitation', 'project_created'
  )),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL NOT NULL,
  action text NOT NULL CHECK (action IN (
    'workspace_created', 'workspace_updated', 'workspace_deleted',
    'project_created', 'project_updated', 'project_deleted',
    'task_created', 'task_updated', 'task_deleted', 'task_status_updated',
    'task_assigned', 'task_unassigned', 'comment_created', 'comment_updated',
    'comment_deleted', 'attachment_uploaded', 'attachment_deleted',
    'user_joined', 'user_left', 'role_changed'
  )),
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_workspace_id_idx ON notifications(workspace_id);
CREATE INDEX IF NOT EXISTS notifications_task_id_idx ON notifications(task_id);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications(type);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

CREATE INDEX IF NOT EXISTS activities_workspace_id_idx ON activities(workspace_id);
CREATE INDEX IF NOT EXISTS activities_project_id_idx ON activities(project_id);
CREATE INDEX IF NOT EXISTS activities_task_id_idx ON activities(task_id);
CREATE INDEX IF NOT EXISTS activities_user_id_idx ON activities(user_id);
CREATE INDEX IF NOT EXISTS activities_action_idx ON activities(action);
CREATE INDEX IF NOT EXISTS activities_created_at_idx ON activities(created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can read their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = current_user_id());

CREATE POLICY "System can create notifications"
  ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = current_user_id());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  TO authenticated
  USING (user_id = current_user_id());

-- RLS Policies for activities
CREATE POLICY "Workspace members can read activities"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

CREATE POLICY "System can create activities"
  ON activities
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create activities"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = current_user_id() AND
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = activities.workspace_id
        AND workspace_members.user_id = current_user_id()
        AND workspace_members.is_active = true
    )
  );

-- Function to automatically mark notification as read when read_at is set
CREATE OR REPLACE FUNCTION auto_mark_notification_read()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
    NEW.is_read = true;
  ELSIF NEW.is_read = true AND OLD.is_read = false AND NEW.read_at IS NULL THEN
    NEW.read_at = now();
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger for notification read status
CREATE TRIGGER auto_mark_notification_read_trigger
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION auto_mark_notification_read();

-- Function to clean up old activities (optional - can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_old_activities(days_to_keep integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM activities 
  WHERE created_at < now() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to clean up old read notifications (optional)
CREATE OR REPLACE FUNCTION cleanup_old_notifications(days_to_keep integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM notifications 
  WHERE is_read = true 
    AND read_at < now() - (days_to_keep || ' days')::interval;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;