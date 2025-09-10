const { supabaseAdmin } = require('../config/database');

class ActivityService {
  async logActivity(activityData) {
    try {
      const {
        workspace_id,
        project_id = null,
        task_id = null,
        user_id,
        action,
        details = {}
      } = activityData;

      const { data: activity, error } = await supabaseAdmin
        .from('activities')
        .insert({
          workspace_id,
          project_id,
          task_id,
          user_id,
          action,
          details,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          ),
          workspaces (
            id,
            name
          ),
          projects (
            id,
            name
          ),
          tasks (
            id,
            title
          )
        `)
        .single();

      if (error) {
        console.error('Error logging activity:', error);
        return null;
      }

      // Emit activity to workspace members via socket
      const io = global.io;
      if (io) {
        io.to(`workspace_${workspace_id}`).emit('new_activity', {
          ...activity,
          user: activity.users,
          workspace: activity.workspaces,
          project: activity.projects,
          task: activity.tasks
        });
      }

      return activity;
    } catch (error) {
      console.error('Activity service error:', error);
      return null;
    }
  }

  async getWorkspaceActivities(workspaceId, options = {}) {
    try {
      const { page = 1, limit = 50, action_filter } = options;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('activities')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          ),
          projects (
            id,
            name
          ),
          tasks (
            id,
            title
          )
        `)
        .eq('workspace_id', workspaceId);

      if (action_filter) {
        query = query.eq('action', action_filter);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: activities, error } = await query;

      if (error) throw error;

      return activities.map(activity => ({
        ...activity,
        user: activity.users,
        project: activity.projects,
        task: activity.tasks
      }));
    } catch (error) {
      console.error('Get activities error:', error);
      return [];
    }
  }

  async getTaskActivities(taskId, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;
      const offset = (page - 1) * limit;

      const { data: activities, error } = await supabaseAdmin
        .from('activities')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return activities.map(activity => ({
        ...activity,
        user: activity.users
      }));
    } catch (error) {
      console.error('Get task activities error:', error);
      return [];
    }
  }
}

module.exports = new ActivityService();