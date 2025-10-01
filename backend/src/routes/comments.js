const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateComment, validateUUID, validatePagination } = require('../middleware/validation');
const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/task/:taskId',
  authenticateToken,
  validateUUID('taskId'),
  validatePagination,
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          id,
          projects (
            workspace_id
          )
        `)
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', task.projects.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to task' });
      }

      const { data: comments, error } = await supabaseAdmin
        .from('comments')
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          ),
          comment_mentions (
            mentioned_user_id,
            users (
              id,
              full_name
            )
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const formattedComments = comments.map(comment => ({
        ...comment,
        author: comment.users,
        mentions: comment.comment_mentions.map(mention => mention.users)
      }));

      formattedComments.forEach(comment => {
        delete comment.users;
        delete comment.comment_mentions;
      });

      res.json({ comments: formattedComments });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  }
);

router.post('/',
  authenticateToken,
  validateComment,
  async (req, res) => {
    try {
      const { content, task_id } = req.body;

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          id,
          title,
          projects (
            workspace_id,
            name
          )
        `)
        .eq('id', task_id)
        .single();

      if (taskError || !task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', task.projects.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to task' });
      }

      const { data: comment, error: commentError } = await supabaseAdmin
        .from('comments')
        .insert({
          content,
          task_id,
          user_id: req.user.id
        })
        .select(`
          *,
          users (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (commentError) throw commentError;

      const mentionMatches = content.match(/@(\w+)/g);
      const mentionedUsers = [];

      if (mentionMatches) {
        for (const match of mentionMatches) {
          const username = match.substring(1);
          
          const { data: mentionedUser } = await supabaseAdmin
            .from('users')
            .select('id, full_name')
            .eq('username', username)
            .single();

          if (mentionedUser) {
            const { data: mentionedMembership } = await supabaseAdmin
              .from('workspace_members')
              .select('user_id')
              .eq('workspace_id', task.projects.workspace_id)
              .eq('user_id', mentionedUser.id)
              .single();

            if (mentionedMembership) {
              mentionedUsers.push(mentionedUser);

              await supabaseAdmin
                .from('comment_mentions')
                .insert({
                  comment_id: comment.id,
                  mentioned_user_id: mentionedUser.id
                });

              await notificationService.createNotification({
                user_id: mentionedUser.id,
                workspace_id: task.projects.workspace_id,
                task_id: task_id,
                type: 'mentioned',
                title: 'You were mentioned in a comment',
                message: `${req.user.full_name} mentioned you in task "${task.title}"`,
                data: { 
                  task_id: task_id,
                  comment_id: comment.id,
                  project_name: task.projects.name
                }
              });
            }
          }
        }
      }

      await activityService.logActivity({
        workspace_id: task.projects.workspace_id,
        project_id: task.project_id,
        task_id: task_id,
        user_id: req.user.id,
        action: 'comment_created',
        details: { 
          task_title: task.title,
          mention_count: mentionedUsers.length
        }
      });

      const io = req.app.get('socketio');
      io.to(`task_${task_id}`).emit('comment_created', {
        comment: {
          ...comment,
          author: comment.users,
          mentions: mentionedUsers
        },
        task_title: task.title
      });

      const formattedComment = {
        ...comment,
        author: comment.users,
        mentions: mentionedUsers
      };
      delete formattedComment.users;

      res.status(201).json({
        message: 'Comment created successfully',
        comment: formattedComment
      });
    } catch (error) {
      console.error('Create comment error:', error);
      res.status(500).json({ error: 'Failed to create comment' });
    }
  }
);

module.exports = router;