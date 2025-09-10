const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateUUID, validatePagination } = require('../middleware/validation');

const router = express.Router();

// Get user notifications
router.get('/',
  authenticateToken,
  validatePagination,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, unread_only } = req.query;
      const offset = (page - 1) * limit;

      let query = supabaseAdmin
        .from('notifications')
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
        .eq('user_id', req.user.id);

      if (unread_only === 'true') {
        query = query.eq('is_read', false);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: notifications, error } = await query;

      if (error) throw error;

      const formattedNotifications = notifications.map(notification => ({
        ...notification,
        workspace: notification.workspaces,
        task: notification.tasks
      }));

      formattedNotifications.forEach(notification => {
        delete notification.workspaces;
        delete notification.tasks;
      });

      res.json({ notifications: formattedNotifications });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }
);

// Mark notification as read
router.patch('/:notificationId/read',
  authenticateToken,
  validateUUID('notificationId'),
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      const { data: notification, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', req.user.id)
        .select()
        .single();

      if (error) throw error;

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }
);

// Mark all notifications as read
router.patch('/read-all',
  authenticateToken,
  async (req, res) => {
    try {
      const { data: notifications, error } = await supabaseAdmin
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', req.user.id)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;

      res.json({
        message: 'All notifications marked as read',
        updated_count: notifications.length
      });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
    }
  }
);

// Get notification counts
router.get('/counts',
  authenticateToken,
  async (req, res) => {
    try {
      const { data: unreadCount, error: unreadError } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', req.user.id)
        .eq('is_read', false);

      if (unreadError) throw unreadError;

      const { data: totalCount, error: totalError } = await supabaseAdmin
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', req.user.id);

      if (totalError) throw totalError;

      res.json({
        unread: unreadCount.length,
        total: totalCount.length
      });
    } catch (error) {
      console.error('Get notification counts error:', error);
      res.status(500).json({ error: 'Failed to fetch notification counts' });
    }
  }
);

module.exports = router;