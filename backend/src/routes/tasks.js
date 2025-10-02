const express = require('express');
const { body } = require('express-validator');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateTask, validateUUID, validatePagination, handleValidationErrors } = require('../middleware/validation');
const activityService = require('../services/activityService');
const notificationService = require('../services/notificationService');

const router = express.Router();

router.get('/project/:projectId',
  authenticateToken,
  validateUUID('projectId'),
  validatePagination,
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 50, status, priority, assignee, search } = req.query;
      const offset = (page - 1) * limit;

      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('workspace_id')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to project' });
      }

      let query = supabaseAdmin
        .from('tasks')
        .select(`
          *,
          users!tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          task_assignments (
            users (
              id,
              full_name,
              avatar_url
            )
          ),
          subtasks (
            id,
            title,
            is_completed
          ),
          attachments (
            id,
            filename,
            file_url
          ),
          comments (
            id
          )
        `)
        .eq('project_id', projectId);

      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (assignee) {
        query = query.contains('task_assignments.user_id', assignee);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: tasks, error } = await query;

      if (error) throw error;

      const formattedTasks = tasks.map(task => ({
        ...task,
        created_by: task.users,
        assignees: task.task_assignments.map(ta => ta.users),
        subtask_stats: {
          total: task.subtasks.length,
          completed: task.subtasks.filter(st => st.is_completed).length
        },
        attachment_count: task.attachments.length,
        comment_count: task.comments.length
      }));

      formattedTasks.forEach(task => {
        delete task.users;
        delete task.task_assignments;
        delete task.subtasks;
        delete task.attachments;
        delete task.comments;
      });

      res.json({ tasks: formattedTasks });
    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  }
);

router.get('/:taskId',
  authenticateToken,
  validateUUID('taskId'),
  async (req, res) => {
    try {
      const { taskId } = req.params;

      const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects (
            id,
            name,
            workspace_id
          ),
          users!tasks_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          task_assignments (
            users (
              id,
              full_name,
              avatar_url,
              email
            )
          ),
          subtasks (
            id,
            title,
            description,
            is_completed,
            created_at,
            updated_at
          ),
          attachments (
            id,
            filename,
            file_url,
            file_size,
            uploaded_at,
            users (
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', taskId)
        .single();

      if (error || !task) {
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

      const formattedTask = {
        ...task,
        project: task.projects,
        created_by: task.users,
        assignees: task.task_assignments.map(ta => ta.users),
        attachments: task.attachments.map(attachment => ({
          ...attachment,
          uploaded_by: attachment.users
        }))
      };

      delete formattedTask.projects;
      delete formattedTask.users;
      delete formattedTask.task_assignments;

      res.json({ task: formattedTask });
    } catch (error) {
      console.error('Get task error:', error);
      res.status(500).json({ error: 'Failed to fetch task' });
    }
  }
);

router.post('/',
  authenticateToken,
  validateTask,
  async (req, res) => {
    try {
      const { title, description, priority = 'medium', status = 'todo', due_date, project_id, assignee_ids = [] } = req.body;

      const { data: project, error: projectError } = await supabaseAdmin
        .from('projects')
        .select('workspace_id, name')
        .eq('id', project_id)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership || !['member', 'admin', 'owner'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to create task' });
      }

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .insert({
          title,
          description,
          priority,
          status,
          due_date,
          project_id,
          created_by: req.user.id
        })
        .select()
        .single();

      if (taskError) throw taskError;

      if (assignee_ids.length > 0) {
        const assignments = assignee_ids.map(user_id => ({
          task_id: task.id,
          user_id,
          assigned_by: req.user.id
        }));

        const { error: assignmentError } = await supabaseAdmin
          .from('task_assignments')
          .insert(assignments);

        if (assignmentError) throw assignmentError;

        for (const assignee_id of assignee_ids) {
          await notificationService.createNotification({
            user_id: assignee_id,
            workspace_id: project.workspace_id,
            task_id: task.id,
            type: 'task_assigned',
            title: 'Task assigned to you',
            message: `You have been assigned to task "${task.title}"`,
            data: { task_id: task.id, project_name: project.name }
          });
        }
      }

      await activityService.logActivity({
        workspace_id: project.workspace_id,
        project_id: project_id,
        task_id: task.id,
        user_id: req.user.id,
        action: 'task_created',
        details: { task_title: task.title, assignee_count: assignee_ids.length }
      });

      const io = req.app.get('socketio');
      io.to(`project_${project_id}`).emit('task_created', {
        task,
        created_by: req.user,
        project_name: project.name
      });

      res.status(201).json({
        message: 'Task created successfully',
        task
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  }
);

router.patch('/:taskId/status',
  authenticateToken,
  validateUUID('taskId'),
  [
    body('status').isIn(['todo', 'in_progress', 'review', 'done']).withMessage('Invalid status'),
    handleValidationErrors
  ],
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status } = req.body;

      const { data: task, error: taskError } = await supabaseAdmin
        .from('tasks')
        .select(`
          *,
          projects (
            workspace_id,
            name
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

      const { data: updatedTask, error: updateError } = await supabaseAdmin
        .from('tasks')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) throw updateError;

      await activityService.logActivity({
        workspace_id: task.projects.workspace_id,
        project_id: task.project_id,
        task_id: taskId,
        user_id: req.user.id,
        action: 'task_status_updated',
        details: { 
          task_title: task.title,
          old_status: task.status,
          new_status: status
        }
      });

      const io = req.app.get('socketio');
      io.to(`project_${task.project_id}`).emit('task_updated', {
        task: updatedTask,
        updated_by: req.user,
        changes: { status: { old: task.status, new: status } }
      });

      res.json({
        message: 'Task status updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task status error:', error);
      res.status(500).json({ error: 'Failed to update task status' });
    }
  }
);

module.exports = router;