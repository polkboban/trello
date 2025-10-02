const express = require('express');
const { supabaseAdmin } = require('../config/database');
const { authenticateToken, checkWorkspaceAccess } = require('../middleware/auth');
const { validateProject, validateUUID, validatePagination } = require('../middleware/validation');
const activityService = require('../services/activityService');

const router = express.Router();

router.get('/workspace/:workspaceId',
  authenticateToken,
  validateUUID('workspaceId'),
  checkWorkspaceAccess('member'),
  validatePagination,
  async (req, res) => {
    try {
      const { workspaceId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { data: projects, error } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          users!projects_created_by_fkey (
            id,
            full_name,
            avatar_url
          ),
          tasks (
            id,
            status
          )
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const formattedProjects = projects.map(project => ({
        ...project,
        created_by: project.users,
        task_stats: {
          total: project.tasks.length,
          todo: project.tasks.filter(t => t.status === 'todo').length,
          in_progress: project.tasks.filter(t => t.status === 'in_progress').length,
          review: project.tasks.filter(t => t.status === 'review').length,
          done: project.tasks.filter(t => t.status === 'done').length
        }
      }));

      formattedProjects.forEach(project => {
        delete project.users;
        delete project.tasks;
      });

      res.json({ projects: formattedProjects });
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  }
);

router.get('/:projectId',
  authenticateToken,
  validateUUID('projectId'),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const { data: project, error } = await supabaseAdmin
        .from('projects')
        .select(`
          *,
          workspaces (
            id,
            name
          ),
          users!projects_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('id', projectId)
        .single();

      if (error) throw error;

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', project.workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership) {
        return res.status(403).json({ error: 'Access denied to project' });
      }

      const formattedProject = {
        ...project,
        workspace: project.workspaces,
        created_by: project.users,
        user_role: membership.role
      };

      delete formattedProject.workspaces;
      delete formattedProject.users;

      res.json({ project: formattedProject });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to fetch project' });
    }
  }
);

router.post('/',
  authenticateToken,
  validateProject,
  async (req, res) => {
    try {
      const { name, description, workspace_id } = req.body;

      const { data: membership } = await supabaseAdmin
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspace_id)
        .eq('user_id', req.user.id)
        .single();

      if (!membership || !['member', 'admin', 'owner'].includes(membership.role)) {
        return res.status(403).json({ error: 'Insufficient permissions to create project' });
      }

      const { data: project, error } = await supabaseAdmin
        .from('projects')
        .insert({
          name,
          description,
          workspace_id,
          created_by: req.user.id
        })
        .select(`
          *,
          users!projects_created_by_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      await activityService.logActivity({
        workspace_id,
        project_id: project.id,
        user_id: req.user.id,
        action: 'project_created',
        details: { project_name: project.name }
      });

      const formattedProject = {
        ...project,
        created_by: project.users
      };
      delete formattedProject.users;

      res.status(201).json({
        message: 'project created successfully',
        project: formattedProject
      });
    } catch (error) {
      console.error('create project error:', error);
      res.status(500).json({ error: 'failed to create project' });
    }
  }
);

module.exports = router;