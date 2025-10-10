const { supabaseAdmin } = require('../config/database');

class NotificationService {
  async createNotification(notificationData) {
    try {
      const {
        user_id,
        workspace_id,
        task_id = null,
        type,
        title,
        message,
        data = {}
      } = notificationData;

      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id,
          workspace_id,
          task_id,
          type,
          title,
          message,
          data,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          workspaces (
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
        console.error('Error creating notification:', error);
        return null;
      }

      const io = global.io;
      if (io) {
        io.to(`user_${user_id}`).emit('new_notification', {
          ...notification,
          workspace: notification.workspaces,
          task: notification.tasks
        });
      }

      return notification;
    } catch (error) {
      console.error('Notification service error:', error);
      return null;
    }
  }

  async createBulkNotifications(notifications) {
    try {
      const notificationRecords = notifications.map(notification => ({
        ...notification,
        created_at: new Date().toISOString()
      }));

      const { data: createdNotifications, error } = await supabaseAdmin
        .from('notifications')
        .insert(notificationRecords)
        .select();

      if (error) throw error;

      const io = global.io;
      if (io) {
        createdNotifications.forEach(notification => {
          io.to(`user_${notification.user_id}`).emit('new_notification', notification);
        });
      }

      return createdNotifications;
    } catch (error) {
      console.error('Bulk notification error:', error);
      return [];
    }
  }

  async markAsRead(userId, notificationIds) {
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', notificationIds)
        .eq('user_id', userId)
        .select();

      if (error) throw error;

      return notifications;
    } catch (error) {
      console.error('Mark notifications read error:', error);
      return [];
    }
  }

  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  }

  getNotificationTemplate(type, data) {
    const templates = {
      task_assigned: {
        title: 'Task assigned to you',
        message: `You have been assigned to task "${data.task_title}"`
      },
      task_due_soon: {
        title: 'Task due soon',
        message: `Task "${data.task_title}" is due ${data.due_in}`
      },
      mentioned: {
        title: 'You were mentioned',
        message: `${data.mentioned_by} mentioned you in a comment`
      },
      task_completed: {
        title: 'Task completed',
        message: `Task "${data.task_title}" has been completed`
      },
      workspace_invitation: {
        title: 'Workspace invitation',
        message: `You have been invited to join workspace "${data.workspace_name}"`
      }
    };

    return templates[type] || {
      title: 'Notification',
      message: 'You have a new notification'
    };
  }
}

module.exports = new NotificationService();